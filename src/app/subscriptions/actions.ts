"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface SubscribeResult {
  ok: boolean;
  error?: string;
  subscriptionId?: string;
}

// Shared slot validation + date calculation helpers (server-side only)
function calcDates(): { start: string; end: string } {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const start = now.toISOString().slice(0, 10);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 29);
  return { start, end: endDate.toISOString().slice(0, 10) };
}

export async function createSubscription(
  restaurantId: string,
  slots: string[]
): Promise<SubscribeResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "student") return { ok: false, error: "Only students can subscribe" };

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, base_price, serves_lunch, serves_dinner")
    .eq("id", restaurantId)
    .single();
  if (!restaurant) return { ok: false, error: "Restaurant not found" };

  // Validate requested slots against what restaurant serves
  const validSlots = slots.filter(
    (s) => (s === "lunch" && restaurant.serves_lunch) || (s === "dinner" && restaurant.serves_dinner)
  );
  if (validSlots.length === 0) return { ok: false, error: "No valid slots selected" };

  // Check for existing active subscription to this restaurant
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("student_id", user.id)
    .eq("restaurant_id", restaurantId)
    .eq("status", "active")
    .maybeSingle();
  if (existing) return { ok: false, error: "You already have an active subscription here" };

  const { start, end } = calcDates();

  const tokensTotal = 30 * validSlots.length;
  const pricePaid = restaurant.base_price * 30 * validSlots.length;

  const service = createServiceClient();
  const { data: sub, error } = await service
    .from("subscriptions")
    .insert({
      student_id: user.id,
      restaurant_id: restaurantId,
      status: "active",
      slots: validSlots,
      tokens_total: tokensTotal,
      tokens_remaining: tokensTotal,
      rollover_in: 0,
      start_date: start,
      end_date: end,
      price_paid: pricePaid,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createSubscription error:", error.message);
    return { ok: false, error: "Failed to create subscription" };
  }

  return { ok: true, subscriptionId: sub.id };
}

// ── RENEW SUBSCRIPTION ────────────────────────────────────────────────────
// Creates a new 30-day subscription. If previousSubId is supplied, applies
// any rollover_in tokens from that expired sub as a bonus on top of the base tokens.

export async function renewSubscription(
  restaurantId: string,
  slots: string[],
  previousSubId: string | null
): Promise<SubscribeResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "student") return { ok: false, error: "Only students can subscribe" };

  const service = createServiceClient();

  const [{ data: restaurant }, { data: existing }] = await Promise.all([
    service
      .from("restaurants")
      .select("id, base_price, serves_lunch, serves_dinner")
      .eq("id", restaurantId)
      .single(),
    service
      .from("subscriptions")
      .select("id")
      .eq("student_id", user.id)
      .eq("restaurant_id", restaurantId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (!restaurant) return { ok: false, error: "Restaurant not found" };
  if (existing) return { ok: false, error: "You already have an active subscription here" };

  const validSlots = slots.filter(
    (s) => (s === "lunch" && restaurant.serves_lunch) || (s === "dinner" && restaurant.serves_dinner)
  );
  if (validSlots.length === 0) return { ok: false, error: "No valid slots selected" };

  // Read rollover tokens from the previous subscription
  let rolloverTokens = 0;
  if (previousSubId) {
    const { data: prevSub } = await service
      .from("subscriptions")
      .select("rollover_in")
      .eq("id", previousSubId)
      .single();
    rolloverTokens = Number(prevSub?.rollover_in ?? 0);
  }

  const { start, end } = calcDates();
  const tokensBase = 30 * validSlots.length;
  const pricePaid = Number(restaurant.base_price) * 30 * validSlots.length;

  const { data: sub, error } = await service
    .from("subscriptions")
    .insert({
      student_id:       user.id,
      restaurant_id:    restaurantId,
      status:           "active",
      slots:            validSlots,
      tokens_total:     tokensBase,
      tokens_remaining: tokensBase + rolloverTokens,
      rollover_in:      rolloverTokens,
      start_date:       start,
      end_date:         end,
      price_paid:       pricePaid,
    })
    .select("id")
    .single();

  if (error) {
    console.error("renewSubscription error:", error.message);
    return { ok: false, error: "Failed to renew subscription" };
  }

  return { ok: true, subscriptionId: sub.id };
}
