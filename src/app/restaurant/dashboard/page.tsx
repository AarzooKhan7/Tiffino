import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import QRCode from "qrcode";
import RestaurantQR from "@/components/RestaurantQR";
import { nowIST, todayISODate, currentMonthBounds } from "@/lib/ist";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DishInfo { id?: string; name: string; diet_type: string }

function extractDish(raw: unknown): DishInfo | null {
  if (!raw) return null;
  const d = Array.isArray(raw) ? raw[0] : raw;
  if (!d || typeof d !== "object") return null;
  const obj = d as Record<string, unknown>;
  return { id: String(obj.id ?? ""), name: String(obj.name ?? ""), diet_type: String(obj.diet_type ?? "") };
}

function fmt(n: number) { return n.toLocaleString("en-IN"); }

export default async function RestaurantDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const [{ data: profile }, { data: restaurant }] = await Promise.all([
    supabase.from("profiles").select("name, role").eq("id", user.id).single(),
    supabase.from("restaurants").select("id, name, area, serves_lunch, serves_dinner, qr_token").eq("owner_id", user.id).maybeSingle(),
  ]);

  if (!profile || profile.role !== "restaurant") redirect("/");

  // Ensure qr_token exists
  let qrToken = restaurant?.qr_token as string | null;
  if (restaurant && !qrToken) {
    qrToken = randomUUID();
    const service = createServiceClient();
    await service.from("restaurants").update({ qr_token: qrToken }).eq("id", restaurant.id);
  }

  const now         = nowIST();
  const todayIdx    = (now.getDay() + 6) % 7;
  const todayDate   = todayISODate();
  const { start: monthStart } = currentMonthBounds();

  // 7 days ago for weekly trends
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  const [qrDataUrl, { data: todayMenu }] = await Promise.all([
    qrToken
      ? QRCode.toDataURL(qrToken, { width: 300, margin: 2, color: { dark: "#1a1a1a", light: "#ffffff" } })
      : Promise.resolve(null as string | null),
    restaurant
      ? supabase.from("weekly_menu").select("meal_type, dish:dish_id(id, name, diet_type)").eq("restaurant_id", restaurant.id).eq("day_of_week", todayIdx)
      : Promise.resolve({ data: null }),
  ]);

  const lunchRow  = (todayMenu ?? []).find((r) => r.meal_type === "lunch");
  const dinnerRow = (todayMenu ?? []).find((r) => r.meal_type === "dinner");
  const lunchDish  = extractDish(lunchRow?.dish);
  const dinnerDish = extractDish(dinnerRow?.dish);

  // ── All metrics ──────────────────────────────────────────────────────────
  let activeSubs = 0, totalSubs = 0, totalRevenue = 0, tokensOutstanding = 0;
  let lunchForecast = { expected: 0, skipped: 0, taken: 0 };
  let dinnerForecast = { expected: 0, skipped: 0, taken: 0 };
  let weeklyByDay: number[] = Array(7).fill(0);
  let monthTaken = 0, monthSkipped = 0, monthTotal = 0;
  let topDishes: { name: string; count: number }[] = [];

  if (restaurant) {
    const service = createServiceClient();

    const [
      { data: allSubs },
      { data: todayRedemptions },
      { data: weekRedemptions },
      { data: monthRedemptions },
    ] = await Promise.all([
      service.from("subscriptions").select("slots, status, tokens_remaining, price_paid").eq("restaurant_id", restaurant.id),
      service.from("redemptions").select("meal_type, status").eq("restaurant_id", restaurant.id).eq("meal_date", todayDate),
      service.from("redemptions").select("meal_date, meal_type, status").eq("restaurant_id", restaurant.id).gte("meal_date", weekAgoStr).lte("meal_date", todayDate),
      service.from("redemptions").select("meal_type, status").eq("restaurant_id", restaurant.id).gte("meal_date", monthStart).lte("meal_date", todayDate),
    ]);

    for (const s of allSubs ?? []) {
      totalSubs++;
      totalRevenue += Number(s.price_paid ?? 0);
      if (s.status === "active") {
        activeSubs++;
        tokensOutstanding += Number(s.tokens_remaining ?? 0);
        const slots = (s.slots as string[] | null) ?? [];
        if (slots.includes("lunch"))  lunchForecast.expected++;
        if (slots.includes("dinner")) dinnerForecast.expected++;
      }
    }

    for (const r of todayRedemptions ?? []) {
      if (r.meal_type === "lunch") {
        if (r.status === "skipped") lunchForecast.skipped++;
        if (r.status === "taken")   lunchForecast.taken++;
      } else {
        if (r.status === "skipped") dinnerForecast.skipped++;
        if (r.status === "taken")   dinnerForecast.taken++;
      }
    }

    // Weekly by day (count of "taken" per day)
    const byDay: Record<string, number> = {};
    for (const r of weekRedemptions ?? []) {
      if (r.status === "taken") {
        const d = r.meal_date as string;
        byDay[d] = (byDay[d] ?? 0) + 1;
      }
    }
    // Map to day index (last 7 days)
    weeklyByDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return byDay[d.toISOString().slice(0, 10)] ?? 0;
    });

    for (const r of monthRedemptions ?? []) {
      monthTotal++;
      if (r.status === "taken")   monthTaken++;
      if (r.status === "skipped") monthSkipped++;
    }
  }

  const todayServed = lunchForecast.taken + dinnerForecast.taken;
  const todayExpected = lunchForecast.expected + dinnerForecast.expected - lunchForecast.skipped - dinnerForecast.skipped;
  const skipRate = monthTotal > 0 ? Math.round((monthSkipped / monthTotal) * 100) : 0;
  const attendRate = monthTotal > 0 ? Math.round((monthTaken / monthTotal) * 100) : 0;
  const weeklyMax = Math.max(...weeklyByDay, 1);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* ── Welcome ── */}
      <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4">
        <p className="text-xs text-[var(--color-text-muted)]">{greeting},</p>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mt-0.5">
          {profile.name ?? "Restaurant Owner"}
        </h1>
        {restaurant && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--color-brand-primary)] text-white">
              🍽 {restaurant.name}
            </span>
            <span className="text-xs px-3 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]">
              📍 {restaurant.area}
            </span>
            <span className="text-xs px-3 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]">
              {DAY_NAMES[todayIdx]}
            </span>
          </div>
        )}
      </div>

      {!restaurant && (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-8 text-center">
          <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Complete your restaurant setup</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">Add your details so students can find and subscribe.</p>
          <Link href="/restaurant/setup" className="btn-primary px-6 py-2.5 text-sm">
            Set up restaurant →
          </Link>
        </div>
      )}

      {restaurant && (
        <>
          {/* ── Key metrics grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard icon="👥" label="Active subscribers" value={String(activeSubs)} sub={`${totalSubs} total`} accent />
            <MetricCard icon="🍽" label="Served today" value={String(todayServed)} sub={`of ${todayExpected} expected`} />
            <MetricCard icon="💰" label="Total revenue" value={`₹${fmt(totalRevenue)}`} sub="from all plans" />
            <MetricCard icon="🪙" label="Tokens outstanding" value={String(tokensOutstanding)} sub="across active plans" />
          </div>

          {/* ── Monthly rates ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[var(--radius-card)] card-shadow px-4 py-4">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">This month · attendance</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-2 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${attendRate}%` }} />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{monthTaken} meals served</p>
                </div>
                <span className="text-2xl font-extrabold text-green-600">{attendRate}%</span>
              </div>
            </div>
            <div className="bg-white rounded-[var(--radius-card)] card-shadow px-4 py-4">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">This month · skip rate</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-2 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${skipRate > 30 ? "bg-red-400" : "bg-amber-400"}`} style={{ width: `${skipRate}%` }} />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{monthSkipped} skips</p>
                </div>
                <span className={`text-2xl font-extrabold ${skipRate > 30 ? "text-red-500" : "text-amber-500"}`}>{skipRate}%</span>
              </div>
            </div>
          </div>

          {/* ── Weekly meals bar chart ── */}
          <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Meals served — last 7 days</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">Count of scanned (taken) tokens per day</p>
            <div className="flex items-end gap-1.5 h-24">
              {weeklyByDay.map((count, i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - (6 - i));
                const dayLabel = DAY_SHORT[(d.getDay() + 6) % 7];
                const isToday = i === 6;
                const pct = Math.round((count / weeklyMax) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                      {count > 0 ? count : ""}
                    </span>
                    <div className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${Math.max(4, pct)}%`,
                        background: isToday ? "var(--color-brand-primary)" : "var(--color-brand-secondary)",
                        opacity: isToday ? 1 : 0.5 + (pct / 200),
                        minHeight: "4px",
                      }}
                    />
                    <span className={`text-[10px] font-medium ${isToday ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)]"}`}>
                      {isToday ? "Today" : dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Weekly summary ── */}
          <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">This week&apos;s summary</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-green-50 rounded-xl px-2 py-3">
                <p className="text-xl font-extrabold text-green-700">{weeklyByDay.reduce((a, b) => a + b, 0)}</p>
                <p className="text-[10px] text-green-600 font-semibold mt-0.5">Meals served</p>
              </div>
              <div className="bg-red-50 rounded-xl px-2 py-3">
                <p className="text-xl font-extrabold text-red-500">{monthSkipped}</p>
                <p className="text-[10px] text-red-400 font-semibold mt-0.5">Month skips</p>
              </div>
              <div className="bg-orange-50 rounded-xl px-2 py-3">
                <p className="text-xl font-extrabold text-[var(--color-brand-secondary)]">₹{fmt(totalRevenue)}</p>
                <p className="text-[10px] text-orange-600 font-semibold mt-0.5">Revenue</p>
              </div>
            </div>
          </div>

          {/* ── Today's kitchen demand ── */}
          <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Kitchen demand — today</p>
                <p className="text-xs text-[var(--color-text-muted)]">{DAY_NAMES[todayIdx]}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {restaurant.serves_lunch  && <ForecastCard slot="Lunch"  dish={lunchDish}  forecast={lunchForecast} />}
              {restaurant.serves_dinner && <ForecastCard slot="Dinner" dish={dinnerDish} forecast={dinnerForecast} />}
            </div>
          </div>

          {/* ── Today's menu ── */}
          <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Today&apos;s menu</p>
            {(!lunchDish && !dinnerDish) ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No menu set for today.{" "}
                <Link href="/restaurant/menu" className="text-[var(--color-brand-primary)] hover:underline font-medium">
                  Build your weekly menu →
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {restaurant.serves_lunch  && <MealCard slot="Lunch"  dish={lunchDish} />}
                {restaurant.serves_dinner && <MealCard slot="Dinner" dish={dinnerDish} />}
              </div>
            )}
          </div>

          {/* ── QR code ── */}
          {qrDataUrl && <RestaurantQR qrDataUrl={qrDataUrl} restaurantName={restaurant.name} />}

          {/* ── Quick links ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/restaurant/menu",       emoji: "📅", label: "Weekly Menu" },
              { href: "/restaurant/dishes",      emoji: "🍲", label: "Dish Library" },
              { href: "/restaurant/subscribers", emoji: "👥", label: "Subscribers" },
            ].map(({ href, emoji, label }) => (
              <Link
                key={href}
                href={href}
                className="card-shadow rounded-[var(--radius-card)] bg-white px-3 py-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center"
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-[var(--radius-card)] card-shadow px-4 py-4 ${accent ? "bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)] text-white" : "bg-white"}`}>
      <span className="text-xl">{icon}</span>
      <p className={`text-2xl font-extrabold mt-1 leading-none ${accent ? "text-white" : "text-[var(--color-text-primary)]"}`}>{value}</p>
      <p className={`text-[11px] font-semibold mt-1 ${accent ? "text-white/80" : "text-[var(--color-text-secondary)]"}`}>{label}</p>
      <p className={`text-[10px] mt-0.5 ${accent ? "text-white/60" : "text-[var(--color-text-muted)]"}`}>{sub}</p>
    </div>
  );
}

function ForecastCard({ slot, dish, forecast }: {
  slot: string;
  dish: DishInfo | null;
  forecast: { expected: number; skipped: number; taken: number };
}) {
  const remaining = Math.max(0, forecast.expected - forecast.skipped - forecast.taken);
  const pct = forecast.expected > 0 ? Math.round((forecast.taken / forecast.expected) * 100) : 0;

  return (
    <div className="rounded-xl border border-[var(--color-border)] px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">{slot}</p>
        {dish && <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[90px]">{dish.name}</span>}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-extrabold text-[var(--color-text-primary)] leading-none">{remaining}</span>
        <span className="text-xs text-[var(--color-text-muted)] mb-0.5">to prepare</span>
      </div>
      <div className="h-1.5 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
        <div className="h-full bg-[var(--color-brand-primary)] rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)]">
        {forecast.taken} served · {forecast.skipped} skipped · {forecast.expected} subscribed
      </p>
    </div>
  );
}

function MealCard({ slot, dish }: { slot: string; dish: DishInfo | null }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] px-4 py-3">
      <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">{slot}</p>
      {dish ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-[var(--color-text-primary)]">{dish.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            dish.diet_type === "veg"    ? "bg-green-50 text-green-700 border border-green-200" :
            dish.diet_type === "nonveg" ? "bg-red-50 text-red-700 border border-red-200"       :
                                          "bg-orange-50 text-orange-700 border border-orange-200"
          }`}>{dish.diet_type}</span>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">Not set</p>
      )}
    </div>
  );
}
