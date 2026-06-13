import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveStaleRedemptions } from "@/app/redemptions/actions";
import { todayISODate } from "@/lib/ist";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const today = todayISODate();

  const results = {
    expired: 0,
    notifications: 0,
    stale: 0,
    errors: [] as string[],
  };

  // 1 — Expire subscriptions whose end_date is in the past
  // Idempotent: only targets status='active', so re-running is safe
  const { data: expiredRows, error: expireErr } = await service
    .from("subscriptions")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("end_date", today)
    .select("id, student_id, slots");

  if (expireErr) {
    results.errors.push("expire: " + expireErr.message);
  } else {
    results.expired = (expiredRows ?? []).length;
  }

  // 2 — Auto-notifications for active subscriptions
  //   a) low_balance  : tokens_remaining <= 5
  //   b) expiry_warning: 1-3 days to end_date
  // Idempotent: skip if a same-type notification was already created today
  const { data: activeSubs } = await service
    .from("subscriptions")
    .select("id, student_id, tokens_remaining, end_date")
    .eq("status", "active");

  for (const sub of activeSubs ?? []) {
    const tokens = Number(sub.tokens_remaining);
    const daysLeft = Math.ceil(
      (new Date(sub.end_date as string).getTime() - new Date(today).getTime()) / 86400000
    );
    const todayPrefix = today + "T00:00:00";

    // Low balance (> 0 so we don't spam on an already-dead plan)
    if (tokens > 0 && tokens <= 5) {
      const { data: dup } = await service
        .from("notifications")
        .select("id")
        .eq("user_id", sub.student_id)
        .eq("type", "low_balance")
        .gte("created_at", todayPrefix)
        .maybeSingle();

      if (!dup) {
        const { error } = await service.from("notifications").insert({
          user_id: sub.student_id,
          type: "low_balance",
          message: `Your Tiffino token balance is low — only ${tokens} token${tokens === 1 ? "" : "s"} left. Consider renewing your plan before it runs out.`,
          read: false,
        });
        if (error) results.errors.push("notif low_balance: " + error.message);
        else results.notifications++;
      }
    }

    // Near-expiry (1–3 days)
    if (daysLeft >= 1 && daysLeft <= 3) {
      const { data: dup } = await service
        .from("notifications")
        .select("id")
        .eq("user_id", sub.student_id)
        .eq("type", "expiry_warning")
        .gte("created_at", todayPrefix)
        .maybeSingle();

      if (!dup) {
        const { error } = await service.from("notifications").insert({
          user_id: sub.student_id,
          type: "expiry_warning",
          message: `Your Tiffino subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Renew now to keep your meal plan running without interruption.`,
          read: false,
        });
        if (error) results.errors.push("notif expiry_warning: " + error.message);
        else results.notifications++;
      }
    }
  }

  // 3 — Resolve stale pending redemptions (mark unactioned past slots as skipped)
  const stale = await resolveStaleRedemptions();
  results.stale = stale.resolved;
  results.errors.push(...stale.errors);

  return NextResponse.json(results);
}
