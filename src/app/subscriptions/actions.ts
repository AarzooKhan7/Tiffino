"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface SubscribeResult {
  ok: boolean;
  error?: string;
  subscriptionId?: string;
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

  // Calculate dates in IST
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const start = nowIST.toISOString().slice(0, 10);
  const endDate = new Date(nowIST);
  endDate.setDate(endDate.getDate() + 29); // 30-day plan (start inclusive)
  const end = endDate.toISOString().slice(0, 10);

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
