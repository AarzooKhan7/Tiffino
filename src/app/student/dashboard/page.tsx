import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import DailyActions from "@/components/DailyActions";
import RenewPanel from "@/components/RenewPanel";
import PauseButton from "@/components/PauseButton";
import { getSkipStats } from "@/app/redemptions/actions";
import { nowIST, todayISODate, currentMonthBounds } from "@/lib/ist";

export const dynamic = "force-dynamic";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getISTSnapshot(): { dayIndex: number; dateStr: string } {
  const n = nowIST();
  return { dayIndex: (n.getDay() + 6) % 7, dateStr: n.toISOString().slice(0, 10) };
}

interface Dish { name: string; diet_type: string }

function extractDish(raw: unknown): Dish | null {
  if (!raw) return null;
  const d = Array.isArray(raw) ? raw[0] : raw;
  if (!d || typeof d !== "object") return null;
  const obj = d as Record<string, unknown>;
  return { name: String(obj.name ?? ""), diet_type: String(obj.diet_type ?? "") };
}

type SlotStatus = "pending" | "taken" | "skipped";

function calcStreak(takenDates: Set<string>, today: string): number {
  let streak = 0;
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (takenDates.has(dateStr)) { streak++; cursor.setDate(cursor.getDate() - 1); }
    else break;
  }
  return streak;
}

function nextMealCountdown(now: Date, slots: string[]): { label: string; minutesLeft: number } | null {
  const totalMin = now.getHours() * 60 + now.getMinutes();
  if (slots.includes("lunch")  && totalMin < 11 * 60) return { label: "Lunch",  minutesLeft: 11 * 60 - totalMin };
  if (slots.includes("dinner") && totalMin < 17 * 60) return { label: "Dinner", minutesLeft: 17 * 60 - totalMin };
  return null;
}

// Build an array of ISO date strings for the last N days ending today
function lastNDates(todayStr: string, n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(todayStr);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/student");

  // ── Core queries (no pause columns — those are fetched separately) ──────────
  const [{ data: profile }, { data: subscription }, { data: expiredSub }] = await Promise.all([
    supabase.from("profiles").select("name, location, diet_pref, role").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("id, status, slots, tokens_total, tokens_remaining, start_date, end_date, price_paid, restaurant:restaurant_id(id, name, area)")
      .eq("student_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("id, rollover_in, end_date, slots, restaurant:restaurant_id(id, name, area, serves_lunch, serves_dinner, lunch_price, dinner_price, bundle_price)")
      .eq("student_id", user.id)
      .eq("status", "expired")
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile || profile.role !== "student") redirect("/auth/student");

  // ── Pause data — separate fetch, graceful if columns don't exist yet ────────
  let isPaused = false;
  let pauseEndsAtLabel: string | null = null;
  if (subscription?.id) {
    const { data: pauseRow, error: pauseErr } = await supabase
      .from("subscriptions")
      .select("paused_at, pause_ends_at")
      .eq("id", subscription.id)
      .maybeSingle();
    if (!pauseErr && pauseRow) {
      isPaused = !!(pauseRow.paused_at);
      if (pauseRow.pause_ends_at) {
        pauseEndsAtLabel = new Date(pauseRow.pause_ends_at as string).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      }
    }
  }

  const { dayIndex: today, dateStr: todayDate } = getISTSnapshot();
  const now   = nowIST();
  const slots = (subscription?.slots as string[] | null) ?? [];
  const restaurant = subscription?.restaurant as { id: string; name: string; area: string } | null | undefined;

  // ── Per-slot today statuses ────────────────────────────────────────────────
  let todayStatuses: { lunch: SlotStatus; dinner: SlotStatus } = { lunch: "pending", dinner: "pending" };
  let weekMenu: Record<number, { lunch?: Dish | null; dinner?: Dish | null }> = {};
  let skipStats = { lunchSkips: 0, dinnerSkips: 0, freeLunchRemaining: 4, freeDinnerRemaining: 4, tokensAtRisk: 0, projectedRollover: 0 };
  let streak = 0;
  let monthTaken = 0, monthSkipped = 0, monthTotal = 0;

  // 7-day attendance grid: date → slot → status
  type DayGrid = Record<string, Record<string, SlotStatus>>;
  let attendanceGrid: DayGrid = {};
  const last7 = lastNDates(todayDate, 7);

  if (subscription?.id && restaurant?.id) {
    const service = createServiceClient();
    const { start: monthStart } = currentMonthBounds();
    const weekStartStr = last7[0]; // 6 days ago

    const [
      { data: todayRedemptions },
      { data: menuRows },
      stats,
      { data: takenForStreak },
      { data: monthRedemptions },
      { data: weekRedemptions },
    ] = await Promise.all([
      service.from("redemptions").select("meal_type, status")
        .eq("subscription_id", subscription.id).eq("meal_date", todayDate),
      supabase.from("weekly_menu").select("day_of_week, meal_type, dish:dish_id(name, diet_type)")
        .eq("restaurant_id", restaurant.id),
      getSkipStats(subscription.id),
      service.from("redemptions").select("meal_date")
        .eq("subscription_id", subscription.id).eq("status", "taken")
        .order("meal_date", { ascending: false }).limit(60),
      service.from("redemptions").select("status")
        .eq("subscription_id", subscription.id)
        .gte("meal_date", monthStart).lte("meal_date", todayDate),
      // Full week detail: meal_date + meal_type + status
      service.from("redemptions").select("meal_date, meal_type, status")
        .eq("subscription_id", subscription.id)
        .gte("meal_date", weekStartStr).lte("meal_date", todayDate),
    ]);

    skipStats = stats;

    for (const r of todayRedemptions ?? []) {
      if (r.meal_type === "lunch")  todayStatuses.lunch  = r.status as SlotStatus;
      if (r.meal_type === "dinner") todayStatuses.dinner = r.status as SlotStatus;
    }

    for (const row of menuRows ?? []) {
      if (!weekMenu[row.day_of_week]) weekMenu[row.day_of_week] = {};
      (weekMenu[row.day_of_week] as Record<string, unknown>)[row.meal_type] = extractDish(row.dish);
    }

    const takenDates = new Set((takenForStreak ?? []).map((r) => r.meal_date as string));
    streak = calcStreak(takenDates, todayDate);

    for (const r of monthRedemptions ?? []) {
      monthTotal++;
      if (r.status === "taken")   monthTaken++;
      if (r.status === "skipped") monthSkipped++;
    }

    // Build attendance grid
    for (const date of last7) {
      attendanceGrid[date] = {};
      for (const slot of slots) {
        // Default to pending; override from actual redemptions
        attendanceGrid[date][slot] = date === todayDate ? "pending" : "pending";
      }
    }
    for (const r of weekRedemptions ?? []) {
      const d = r.meal_date as string;
      if (attendanceGrid[d]) {
        attendanceGrid[d][r.meal_type as string] = r.status as SlotStatus;
      }
    }
  }

  const endDateStr = subscription?.end_date as string | null;
  const daysLeft   = endDateStr
    ? Math.max(0, Math.ceil((new Date(endDateStr).getTime() - now.getTime()) / 86400000) + 1)
    : 0;
  const tokenPct   = subscription
    ? Math.round((Number(subscription.tokens_remaining) / Number(subscription.tokens_total)) * 100)
    : 0;
  const attendPct  = monthTotal > 0 ? Math.round((monthTaken / monthTotal) * 100) : 0;
  const countdown  = subscription ? nextMealCountdown(now, slots) : null;

  // Savings from free skips: each rollover token = 1 meal saved = price per meal
  const pricePerMeal = subscription && Number(subscription.tokens_total) > 0
    ? Math.round(Number(subscription.price_paid) / Number(subscription.tokens_total))
    : 0;
  const savingsFromSkips = skipStats.projectedRollover * pricePerMeal;

  type ExpiredRestaurant = {
    id: string; name: string; area: string;
    serves_lunch: boolean; serves_dinner: boolean;
    lunch_price: number; dinner_price: number; bundle_price?: number | null;
  };
  const expiredRestaurant = expiredSub
    ? (Array.isArray(expiredSub.restaurant) ? expiredSub.restaurant[0] : expiredSub.restaurant) as ExpiredRestaurant | null
    : null;

  return (
    <div className="space-y-4 page-fade">

      {/* ── Greeting ── */}
      <div className="pt-1">
        <p className="text-sm text-[var(--color-text-muted)]">{greeting()},</p>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-0.5 leading-tight">
          {profile.name ?? "Student"}
        </h1>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {profile.location && (
            <span className="text-xs border border-[var(--color-border)] rounded-full px-2.5 py-1 text-[var(--color-text-secondary)]">
              📍 {profile.location}
            </span>
          )}
          {profile.diet_pref && (
            <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${
              profile.diet_pref === "veg"    ? "bg-green-50 text-green-700 border border-green-200"   :
              profile.diet_pref === "nonveg" ? "bg-red-50 text-red-700 border border-red-200"         :
                                               "bg-orange-50 text-orange-700 border border-orange-200"
            }`}>
              {profile.diet_pref === "veg" ? "🥦 Veg" : profile.diet_pref === "nonveg" ? "🍗 Non-veg" : "🍱 Mix"}
            </span>
          )}
          {streak > 0 && (
            <span className="text-xs rounded-full px-2.5 py-1 font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              🔥 {streak} day streak
            </span>
          )}
        </div>
      </div>

      {subscription && restaurant ? (
        <>
          {/* ── Paused banner (shown prominently when paused) ── */}
          {isPaused && (
            <div className="rounded-[var(--radius-card)] bg-amber-50 border-2 border-amber-300 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">⏸</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 text-sm">Subscription paused</p>
                  {pauseEndsAtLabel && (
                    <p className="text-xs text-amber-700 mt-0.5">
                      Resumes automatically on <strong>{pauseEndsAtLabel}</strong>
                    </p>
                  )}
                  <p className="text-xs text-amber-700 mt-1">No tokens are consumed while paused.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Near-expiry warning ── */}
          {daysLeft <= 5 && daysLeft > 0 && !isPaused && (
            <div className="rounded-[var(--radius-card)] bg-amber-50 border border-amber-200 px-5 py-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-amber-800 text-sm">⏰ Expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}</p>
                <p className="text-xs text-amber-700 mt-0.5">Renew to keep your meal plan uninterrupted.</p>
              </div>
              <Link href={`/restaurants/${restaurant.id}`}
                className="text-xs bg-amber-600 text-white px-3.5 py-2 rounded-full font-semibold hover:bg-amber-700 transition-colors shrink-0">
                Renew →
              </Link>
            </div>
          )}

          {/* ── Token wallet card ── */}
          <div className="relative rounded-[var(--radius-card)] overflow-hidden text-white"
            style={{ background: isPaused ? "linear-gradient(135deg, #92400e 0%, #b45309 100%)" : "linear-gradient(135deg, #e23744 0%, #fc8019 100%)" }}>
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
            <div className="absolute -bottom-14 -left-10 w-52 h-52 bg-white/10 rounded-full" />
            <div className="relative px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white/70 text-[11px] font-semibold uppercase tracking-widest">
                    {isPaused ? "Paused" : "Meal tokens"}
                  </p>
                  <div className="flex items-end gap-1.5 mt-1">
                    <span className="text-5xl font-extrabold leading-none">{subscription.tokens_remaining}</span>
                    <span className="text-white/60 text-sm mb-1">/ {subscription.tokens_total}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-[11px] font-semibold">Days left</p>
                  <p className="text-3xl font-extrabold">{daysLeft}</p>
                  <p className="text-white/60 text-xs mt-0.5">{DAYS_FULL[today]}</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/80 rounded-full" style={{ width: `${tokenPct}%` }} />
              </div>
              <p className="text-white/60 text-[11px] mt-1.5">{tokenPct}% remaining</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white/60 text-xs">Mess</p>
                  <p className="font-bold text-sm">{restaurant.name}</p>
                  <p className="text-white/60 text-xs">{slots.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ")}</p>
                </div>
                <Link href={`/restaurants/${restaurant.id}`}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full font-semibold transition-colors shrink-0">
                  View mess →
                </Link>
              </div>
            </div>
          </div>

          {/* ── Stat pills ── */}
          <div className="grid grid-cols-3 gap-2.5">
            <StatPill icon="📅" label="Attendance" value={`${attendPct}%`} sub="this month" color={attendPct >= 70 ? "green" : "amber"} />
            <StatPill icon="✅" label="Eaten"      value={String(monthTaken)} sub="this month" color="green" />
            <StatPill icon="⏭" label="Skipped"    value={String(monthSkipped)} sub="this month" color={monthSkipped > 4 ? "amber" : "default"} />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <StatPill icon="🎁" label="Rollover"   value={`+${skipStats.projectedRollover}`} sub="tokens" color="brand" />
            <StatPill icon="🔥" label="Streak"     value={`${streak}d`} sub="in a row" color={streak >= 7 ? "amber" : "default"} />
            <StatPill icon="💰" label="Savings"    value={savingsFromSkips > 0 ? `₹${savingsFromSkips}` : "—"} sub="from skips" color={savingsFromSkips > 0 ? "green" : "default"} />
          </div>

          {/* ── Next meal countdown ── */}
          {countdown && !isPaused && (
            <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-3.5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-alt)] flex items-center justify-center text-xl shrink-0">
                {countdown.label === "Lunch" ? "🌞" : "🌙"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {countdown.label} opens in {countdown.minutesLeft >= 60
                    ? `${Math.floor(countdown.minutesLeft / 60)}h ${countdown.minutesLeft % 60}m`
                    : `${countdown.minutesLeft}m`}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Scanning opens at {countdown.label === "Lunch" ? "11:00 AM" : "5:00 PM"} IST
                </p>
              </div>
            </div>
          )}

          {/* ── Today's meal actions ── */}
          {!isPaused && (
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2.5">Today&apos;s meals</h2>
              <DailyActions
                subscriptionId={subscription.id}
                slots={slots}
                todayStatuses={todayStatuses}
                skipStats={skipStats}
                restaurantName={restaurant.name}
              />
            </div>
          )}

          {/* ── 7-Day Attendance Grid ── */}
          {slots.length > 0 && (
            <div className="bg-white rounded-[var(--radius-card)] card-shadow overflow-hidden">
              <div className="px-5 pt-4 pb-2 border-b border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Last 7 days
                  </h2>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Taken</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />Skipped</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />Pending</span>
                  </div>
                </div>
                {/* Month stats row */}
                <div className="flex gap-4 mt-2">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    This month: <strong className="text-green-700">{monthTaken} eaten</strong> · <strong className="text-[var(--color-text-primary)]">{attendPct}% attendance</strong>
                  </span>
                </div>
              </div>

              {/* Day rows */}
              <div className="divide-y divide-[var(--color-border)]">
                {last7.map((date) => {
                  const d    = new Date(date);
                  const dow  = (d.getDay() + 6) % 7; // Mon=0
                  const isToday = date === todayDate;
                  const dayLabel = DAYS_SHORT[dow];
                  const dayNum   = d.getDate();
                  return (
                    <div key={date} className={`flex items-center gap-4 px-5 py-2.5 ${isToday ? "bg-orange-50" : ""}`}>
                      {/* Date label */}
                      <div className="w-10 shrink-0 text-center">
                        <p className={`text-[11px] font-semibold ${isToday ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)]"}`}>{dayLabel}</p>
                        <p className={`text-sm font-bold leading-tight ${isToday ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-primary)]"}`}>{dayNum}</p>
                        {isToday && <p className="text-[9px] text-[var(--color-brand-primary)] font-semibold uppercase">Today</p>}
                      </div>

                      {/* Slot status pills */}
                      <div className="flex gap-2 flex-wrap">
                        {slots.map((slot) => {
                          const status = attendanceGrid[date]?.[slot] ?? (date < todayDate ? "pending" : "pending");
                          return (
                            <SlotPill key={slot} slot={slot} status={status} isFuture={date > todayDate} />
                          );
                        })}
                      </div>

                      {/* Day summary dot */}
                      <div className="ml-auto shrink-0">
                        {slots.every((s) => attendanceGrid[date]?.[s] === "taken") && slots.length > 0 && (
                          <span className="text-green-600 text-sm">✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Skip quota footer */}
              <div className="px-5 py-3 bg-[var(--color-surface-alt)] border-t border-[var(--color-border)]">
                <div className="flex gap-4 flex-wrap">
                  {slots.includes("lunch") && (
                    <SkipQuotaChip label="Lunch" used={skipStats.lunchSkips} free={skipStats.freeLunchRemaining} />
                  )}
                  {slots.includes("dinner") && (
                    <SkipQuotaChip label="Dinner" used={skipStats.dinnerSkips} free={skipStats.freeDinnerRemaining} />
                  )}
                </div>
                {skipStats.projectedRollover > 0 && (
                  <p className="text-xs text-green-700 mt-2">
                    🎁 +{skipStats.projectedRollover} token{skipStats.projectedRollover > 1 ? "s" : ""} rolling over at month end
                  </p>
                )}
                {skipStats.tokensAtRisk > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠ {skipStats.tokensAtRisk} token{skipStats.tokensAtRisk > 1 ? "s" : ""} forfeited — free skip quota exceeded
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Plan details + pause ── */}
          <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Plan period</p>
                <p className="font-semibold text-[var(--color-text-primary)] text-sm">
                  {subscription.start_date as string} → {subscription.end_date as string}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Paid</p>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  ₹{Number(subscription.price_paid).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] pt-3">
              <PauseButton
                subscriptionId={subscription.id}
                isPaused={isPaused}
                pauseEndsAt={pauseEndsAtLabel}
              />
            </div>
          </div>

          {/* ── This week's menu ── */}
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2.5">This week&apos;s menu</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory no-scrollbar">
              {Array.from({ length: 7 }).map((_, offset) => {
                const dayIdx = (today + offset) % 7;
                const isToday = offset === 0;
                return (
                  <div key={offset}
                    className={`shrink-0 snap-start w-[calc(50vw-1.75rem)] sm:w-48 rounded-[var(--radius-card)] border overflow-hidden ${
                      isToday ? "border-[var(--color-brand-primary)] card-shadow" : "border-[var(--color-border)] card-shadow-sm bg-white"
                    }`}
                  >
                    <div className={`px-3 py-2 text-xs font-bold flex items-center justify-between ${
                      isToday ? "bg-[var(--color-brand-primary)] text-white" : "bg-white text-[var(--color-text-muted)]"
                    }`}>
                      <span>{DAYS_SHORT[dayIdx]}</span>
                      {isToday && <span className="bg-white/20 rounded-full px-2 py-0.5 text-[10px]">Today</span>}
                    </div>
                    <div className={`px-3 py-2.5 space-y-2 ${isToday ? "bg-orange-50" : "bg-white"}`}>
                      {slots.includes("lunch")  && <MenuChip label="L" dish={weekMenu[dayIdx]?.lunch} />}
                      {slots.includes("dinner") && <MenuChip label="D" dish={weekMenu[dayIdx]?.dinner} />}
                      {slots.length === 0 && <p className="text-xs text-[var(--color-text-muted)]">—</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : expiredSub && expiredRestaurant ? (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-card)] bg-amber-50 border border-amber-200 px-5 py-4">
            <p className="font-bold text-amber-800">Your plan has expired</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {expiredRestaurant.name} · ended {expiredSub.end_date as string}
            </p>
            {Number(expiredSub.rollover_in ?? 0) > 0 && (
              <p className="text-xs text-green-800 bg-green-100 rounded-lg px-3 py-1.5 mt-2 inline-block font-medium">
                🎁 {expiredSub.rollover_in} rollover token{Number(expiredSub.rollover_in) > 1 ? "s" : ""} ready
              </p>
            )}
          </div>
          <RenewPanel
            restaurantId={expiredRestaurant.id}
            restaurantName={expiredRestaurant.name}
            servesLunch={expiredRestaurant.serves_lunch}
            servesDinner={expiredRestaurant.serves_dinner}
            previousSubId={expiredSub.id as string}
            rolloverTokens={Number(expiredSub.rollover_in ?? 0)}
            lunchPrice={Number(expiredRestaurant.lunch_price ?? 1500)}
            dinnerPrice={Number(expiredRestaurant.dinner_price ?? 1500)}
            bundlePrice={expiredRestaurant.bundle_price ?? null}
          />
          <p className="text-xs text-center text-[var(--color-text-muted)]">
            Want a different mess?{" "}
            <Link href="/" className="text-[var(--color-brand-primary)] font-medium hover:underline">Browse all →</Link>
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[var(--radius-card)] card-shadow overflow-hidden">
          <div className="relative h-32 bg-gradient-to-r from-red-50 to-orange-50 flex items-center justify-center">
            <span className="text-6xl">🍱</span>
          </div>
          <div className="px-6 py-6 text-center">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">No active subscription</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-5">
              Browse local messes and subscribe to a 30-day plan.
            </p>
            <Link href="/" className="btn-primary px-8 py-3">Browse messes</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function greeting(): string {
  const h = nowIST().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatPill({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub: string;
  color: "green" | "amber" | "brand" | "default";
}) {
  const bg = color === "green" ? "bg-green-50 border-green-100" : color === "amber" ? "bg-amber-50 border-amber-100" : color === "brand" ? "bg-orange-50 border-orange-100" : "bg-white border-[var(--color-border)]";
  const tc = color === "green" ? "text-green-700" : color === "amber" ? "text-amber-700" : color === "brand" ? "text-[var(--color-brand-secondary)]" : "text-[var(--color-text-primary)]";
  return (
    <div className={`rounded-[var(--radius-card)] border card-shadow-sm px-3 py-3 text-center ${bg}`}>
      <span className="text-lg">{icon}</span>
      <p className={`text-lg font-extrabold mt-0.5 leading-none ${tc}`}>{value}</p>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{sub}</p>
      <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>
    </div>
  );
}

function SlotPill({ slot, status, isFuture }: { slot: string; status: SlotStatus; isFuture: boolean }) {
  const emoji = slot === "lunch" ? "🌞" : "🌙";
  const label = slot === "lunch" ? "L" : "D";

  const bg =
    isFuture ? "bg-gray-50 text-gray-400 border-gray-200" :
    status === "taken"   ? "bg-green-50 text-green-700 border-green-200" :
    status === "skipped" ? "bg-gray-100 text-gray-500 border-gray-200" :
                           "bg-amber-50 text-amber-700 border-amber-200";
  const dot =
    isFuture ? "bg-gray-300" :
    status === "taken"   ? "bg-green-500" :
    status === "skipped" ? "bg-gray-300" :
                           "bg-amber-400";
  const text =
    isFuture ? "—" :
    status === "taken"   ? "✓" :
    status === "skipped" ? "✕" :
                           "…";

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span className="text-[10px] opacity-70">{label}</span>
      <span>{text}</span>
    </div>
  );
}

function SkipQuotaChip({ label, used, free }: { label: string; used: number; free: number }) {
  const pct = Math.min(100, (used / 4) * 100);
  return (
    <div className="flex items-center gap-2 flex-1 min-w-[140px]">
      <span className="text-xs font-medium text-[var(--color-text-secondary)] shrink-0 w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${used >= 4 ? "bg-red-400" : "bg-green-400"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-semibold shrink-0 ${used >= 4 ? "text-red-600" : "text-[var(--color-text-muted)]"}`}>
        {used}/4
      </span>
      {free > 0 && <span className="text-[10px] text-green-600 shrink-0">{free} left</span>}
    </div>
  );
}

function MenuChip({ label, dish }: { label: string; dish?: Dish | null }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-[var(--color-text-muted)] w-4 shrink-0">{label}</span>
      {dish ? (
        <>
          <span className={`diet-dot shrink-0 ${dish.diet_type === "veg" ? "diet-dot-veg" : dish.diet_type === "nonveg" ? "diet-dot-nonveg" : "diet-dot-mix"}`} style={{ width: 8, height: 8 }} />
          <span className="text-xs font-medium text-[var(--color-text-primary)] truncate leading-tight">{dish.name}</span>
        </>
      ) : (
        <span className="text-xs text-[var(--color-text-muted)]">—</span>
      )}
    </div>
  );
}
