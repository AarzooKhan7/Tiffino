"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { nowIST, todayISODate, currentMonthBounds } from "@/lib/ist";

// ── Types ──────────────────────────────────────────────────────────────────

export type ActionResult = { ok: boolean; error?: string };

export interface SkipStats {
  lunchSkips: number;
  dinnerSkips: number;
  freeLunchRemaining: number;  // max 4
  freeDinnerRemaining: number; // max 4
  tokensAtRisk: number;        // skips beyond free quota = forfeited tokens
  projectedRollover: number;   // free skips that will roll over at month end
}

// ── CLAIM MEAL (scan QR) ───────────────────────────────────────────────────
// Verified columns: subscription_id, student_id, restaurant_id,
//   meal_date(date), meal_type(text), status(text), claimed(boolean)

export async function claimMeal(
  subscriptionId: string,
  slot: "lunch" | "dinner",
  scannedToken: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const today = todayISODate();

  // 1 — Fetch subscription, verify ownership + slot
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, student_id, restaurant_id, status, slots, tokens_remaining")
    .eq("id", subscriptionId)
    .eq("student_id", user.id)
    .single();

  if (!sub) return { ok: false, error: "Subscription not found" };
  if (sub.status !== "active") return { ok: false, error: "Subscription is not active" };
  if (!(sub.slots as string[]).includes(slot)) return { ok: false, error: `Not subscribed to ${slot}` };
  if (Number(sub.tokens_remaining) <= 0) return { ok: false, error: "No tokens remaining" };

  // 2 — Verify the scanned token belongs to the correct restaurant (server-only lookup)
  const service = createServiceClient();
  const { data: restaurant } = await service
    .from("restaurants")
    .select("id, qr_token")
    .eq("qr_token", scannedToken)
    .maybeSingle();

  if (!restaurant) return { ok: false, error: "Invalid QR code — not a Tiffino restaurant" };
  if (restaurant.id !== sub.restaurant_id) {
    return { ok: false, error: "QR code is for a different restaurant than your plan" };
  }

  // 3 — Check for existing redemption this (subscription, date, slot)
  const { data: existing } = await service
    .from("redemptions")
    .select("id, status")
    .eq("subscription_id", subscriptionId)
    .eq("meal_date", today)
    .eq("meal_type", slot)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: existing.status === "taken" ? "Already scanned today" : "Already skipped today" };
  }

  // 4 — Insert redemption (status: taken, claimed: true)
  const { error: insertErr } = await service.from("redemptions").insert({
    subscription_id: subscriptionId,
    student_id:      user.id,
    restaurant_id:   sub.restaurant_id,
    meal_date:       today,
    meal_type:       slot,
    status:          "taken",
    claimed:         true,
  });
  if (insertErr) return { ok: false, error: "Failed to record meal: " + insertErr.message };

  // 5 — Decrement tokens_remaining by 1 using a fresh read to avoid stale-snapshot race
  const { data: freshSub } = await service
    .from("subscriptions")
    .select("tokens_remaining")
    .eq("id", subscriptionId)
    .single();
  const currentTokens = Number(freshSub?.tokens_remaining ?? sub.tokens_remaining);
  const { error: updateErr } = await service
    .from("subscriptions")
    .update({ tokens_remaining: Math.max(0, currentTokens - 1) })
    .eq("id", subscriptionId)
    .gt("tokens_remaining", 0); // extra guard: only decrement if still > 0
  if (updateErr) return { ok: false, error: "Token decrement failed: " + updateErr.message };

  revalidatePath("/student/dashboard");
  return { ok: true };
}

// ── SKIP MEAL ─────────────────────────────────────────────────────────────

export async function skipMeal(
  subscriptionId: string,
  slot: "lunch" | "dinner"
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const today = todayISODate();

  // Verify subscription ownership + active
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, student_id, restaurant_id, status, slots")
    .eq("id", subscriptionId)
    .eq("student_id", user.id)
    .single();

  if (!sub) return { ok: false, error: "Subscription not found" };
  if (sub.status !== "active") return { ok: false, error: "Subscription is not active" };
  if (!(sub.slots as string[]).includes(slot)) return { ok: false, error: `Not subscribed to ${slot}` };

  // Enforce skip cutoff (server-side, IST)
  const { data: rest } = await supabase
    .from("restaurants")
    .select("lunch_skip_cutoff, dinner_skip_cutoff")
    .eq("id", sub.restaurant_id)
    .single();
  if (rest) {
    const now  = nowIST();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const raw  = (slot === "lunch" ? rest.lunch_skip_cutoff : rest.dinner_skip_cutoff) as string | null;
    const cut  = raw?.substring(0, 5);
    if (cut && hhmm >= cut) {
      return { ok: false, error: `Skip window closed — ${slot} cutoff is ${cut} IST` };
    }
  }

  const service = createServiceClient();

  // Guard duplicate
  const { data: existing } = await service
    .from("redemptions")
    .select("id, status")
    .eq("subscription_id", subscriptionId)
    .eq("meal_date", today)
    .eq("meal_type", slot)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: existing.status === "taken" ? "Already scanned today" : "Already skipped today" };
  }

  // Insert skip (claimed: false, no token decrement)
  const { error } = await service.from("redemptions").insert({
    subscription_id: subscriptionId,
    student_id:      user.id,
    restaurant_id:   sub.restaurant_id,
    meal_date:       today,
    meal_type:       slot,
    status:          "skipped",
    claimed:         false,
  });
  if (error) return { ok: false, error: "Failed to record skip: " + error.message };

  revalidatePath("/student/dashboard");
  return { ok: true };
}

// ── SKIP STATS (live, from redemptions ledger) ─────────────────────────────

export async function getSkipStats(subscriptionId: string): Promise<SkipStats> {
  const service = createServiceClient();
  const { start, end } = currentMonthBounds();

  const { data: rows } = await service
    .from("redemptions")
    .select("meal_type, status")
    .eq("subscription_id", subscriptionId)
    .eq("status", "skipped")
    .gte("meal_date", start)
    .lt("meal_date", end);

  const lunchSkips  = (rows ?? []).filter((r) => r.meal_type === "lunch").length;
  const dinnerSkips = (rows ?? []).filter((r) => r.meal_type === "dinner").length;

  const FREE_QUOTA = 4;
  const freeLunchRemaining  = Math.max(0, FREE_QUOTA - lunchSkips);
  const freeDinnerRemaining = Math.max(0, FREE_QUOTA - dinnerSkips);
  const tokensAtRisk        = Math.max(0, lunchSkips - FREE_QUOTA) + Math.max(0, dinnerSkips - FREE_QUOTA);
  const projectedRollover   = Math.min(lunchSkips, FREE_QUOTA) + Math.min(dinnerSkips, FREE_QUOTA);

  return { lunchSkips, dinnerSkips, freeLunchRemaining, freeDinnerRemaining, tokensAtRisk, projectedRollover };
}

// ── RESOLVE STALE PENDING DAYS (cron-ready, call externally) ──────────────
// For each active subscription, any day older than today with no redemption
// gets auto-inserted as 'skipped'. Call this from a scheduled job.
// Schema: same as skipMeal but with resolved_at set.

export async function resolveStaleRedemptions(): Promise<{ resolved: number; errors: string[] }> {
  const service = createServiceClient();
  const today = todayISODate();

  // Get all active subscriptions
  const { data: subs } = await service
    .from("subscriptions")
    .select("id, student_id, restaurant_id, slots, start_date, end_date")
    .eq("status", "active");

  if (!subs) return { resolved: 0, errors: [] };

  let resolved = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    const slots = sub.slots as string[];
    // Walk from start_date to the earlier of (yesterday, end_date)
    const start = new Date(sub.start_date);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const endBound = sub.end_date ? new Date(sub.end_date) : yesterday;
    const walkEnd = endBound < yesterday ? endBound : yesterday;

    const cursor = new Date(start);
    while (cursor <= walkEnd) {
      const dateStr = cursor.toISOString().slice(0, 10);
      cursor.setDate(cursor.getDate() + 1);

      for (const slot of slots) {
        // Check if redemption exists
        const { data: existing } = await service
          .from("redemptions")
          .select("id")
          .eq("subscription_id", sub.id)
          .eq("meal_date", dateStr)
          .eq("meal_type", slot)
          .maybeSingle();

        if (!existing) {
          const { error } = await service.from("redemptions").insert({
            subscription_id: sub.id,
            student_id:      sub.student_id,
            restaurant_id:   sub.restaurant_id,
            meal_date:       dateStr,
            meal_type:       slot,
            status:          "skipped",
            claimed:         false,
            resolved_at:     new Date().toISOString(),
          });
          if (error) errors.push(`${sub.id}/${dateStr}/${slot}: ${error.message}`);
          else resolved++;
        }
      }
    }
  }

  return { resolved, errors };
}

// ── MONTH-END ROLLOVER (cron-ready) ───────────────────────────────────────
// At month end: for each active subscription, compute free skips used (<= 4 per slot),
// add them to tokens_remaining as rollover_in credit.
// Call this once at the start of each new month (e.g. 00:01 IST on the 1st).

export async function applyMonthEndRollover(targetMonth: string): Promise<{ updated: number; errors: string[] }> {
  const service = createServiceClient();

  // targetMonth format: 'YYYY-MM' — the month just ended
  const start = `${targetMonth}-01`;
  const [y, m] = targetMonth.split("-").map(Number);
  const endDate = new Date(y, m, 1); // first day of next month
  const end = endDate.toISOString().slice(0, 10);

  const { data: subs } = await service
    .from("subscriptions")
    .select("id, slots, tokens_remaining, rollover_in")
    .eq("status", "active");

  if (!subs) return { updated: 0, errors: [] };

  let updated = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    const { data: skipRows } = await service
      .from("redemptions")
      .select("meal_type")
      .eq("subscription_id", sub.id)
      .eq("status", "skipped")
      .gte("meal_date", start)
      .lt("meal_date", end);

    const slots = sub.slots as string[];
    const lunchSkips  = (skipRows ?? []).filter((r) => r.meal_type === "lunch").length;
    const dinnerSkips = (skipRows ?? []).filter((r) => r.meal_type === "dinner").length;

    const FREE_QUOTA = 4;
    const rollover =
      (slots.includes("lunch")  ? Math.min(lunchSkips,  FREE_QUOTA) : 0) +
      (slots.includes("dinner") ? Math.min(dinnerSkips, FREE_QUOTA) : 0);

    if (rollover > 0) {
      const { error } = await service
        .from("subscriptions")
        .update({
          tokens_remaining: Number(sub.tokens_remaining) + rollover,
          rollover_in: Number(sub.rollover_in ?? 0) + rollover,
        })
        .eq("id", sub.id);
      if (error) errors.push(`${sub.id}: ${error.message}`);
      else updated++;
    }
  }

  return { updated, errors };
}
