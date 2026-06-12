import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function todayIST(): number {
  return (new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay() + 6) % 7;
}

function dateInIST(offsetDays: number): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

interface Dish { name: string; diet_type: string }

function extractDish(raw: unknown): Dish | null {
  if (!raw) return null;
  const d = Array.isArray(raw) ? raw[0] : raw;
  if (!d || typeof d !== "object") return null;
  const obj = d as Record<string, unknown>;
  return { name: String(obj.name ?? ""), diet_type: String(obj.diet_type ?? "") };
}

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/student");

  // Parallel: profile + active subscription
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("name, location, diet_pref, role").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("id, status, slots, tokens_total, tokens_remaining, start_date, end_date, price_paid, restaurant:restaurant_id(id, name, area)")
      .eq("student_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile || profile.role !== "student") redirect("/auth/student");

  const today = todayIST();

  // Fetch weekly menu for subscribed restaurant
  let weekMenu: Record<number, { lunch?: Dish | null; dinner?: Dish | null }> = {};
  const restaurant = subscription?.restaurant as { id: string; name: string; area: string } | null | undefined;

  if (restaurant?.id) {
    const { data: menuRows } = await supabase
      .from("weekly_menu")
      .select("day_of_week, meal_type, dish:dish_id(name, diet_type)")
      .eq("restaurant_id", restaurant.id);

    for (const row of menuRows ?? []) {
      if (!weekMenu[row.day_of_week]) weekMenu[row.day_of_week] = {};
      (weekMenu[row.day_of_week] as Record<string, unknown>)[row.meal_type] = extractDish(row.dish);
    }
  }

  const slots = (subscription?.slots as string[] | null) ?? [];
  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - new Date(dateInIST(0)).getTime()) / 86400000) + 1)
    : 0;

  return (
    <main className="min-h-screen bg-[var(--color-surface-alt)] p-4 sm:p-6">
      <header className="max-w-2xl mx-auto flex items-center justify-between mb-6">
        <span className="text-2xl font-extrabold text-[var(--color-brand-primary)]">Tiffino</span>
        <LogoutButton />
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Greeting */}
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
          <p className="text-sm text-[var(--color-text-muted)]">Welcome back,</p>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-0.5">
            {profile.name ?? "Student"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--color-brand-primary)] text-white text-xs font-semibold px-3 py-1">Student</span>
            {profile.location && (
              <span className="rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs px-3 py-1 border border-[var(--color-border)]">
                📍 {profile.location}
              </span>
            )}
            {profile.diet_pref && (
              <span className="rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs px-3 py-1 border border-[var(--color-border)]">
                🥗 {profile.diet_pref}
              </span>
            )}
          </div>
        </div>

        {/* Active subscription */}
        {subscription && restaurant ? (
          <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Active Plan</p>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{restaurant.name}</h2>
                <p className="text-xs text-[var(--color-text-muted)]">📍 {restaurant.area}</p>
              </div>
              <span className="rounded-full bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 whitespace-nowrap">Active</span>
            </div>

            <div className="mt-4 grid grid-cols-3 divide-x divide-[var(--color-border)] rounded-[var(--radius-btn)] border border-[var(--color-border)] overflow-hidden">
              <Stat label="Tokens Left" value={String(subscription.tokens_remaining)} sub={`of ${subscription.tokens_total}`} />
              <Stat label="Days Left" value={String(daysLeft)} sub="days" />
              <Stat label="Slots" value={slots.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("+")} sub="per day" />
            </div>

            <div className="mt-3 flex gap-2 text-xs text-[var(--color-text-muted)]">
              <span>{subscription.start_date} → {subscription.end_date}</span>
              <span>·</span>
              <span>₹{Number(subscription.price_paid).toLocaleString()} paid</span>
            </div>
          </div>
        ) : (
          <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-8 text-center">
            <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No active subscription</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Browse local messes and subscribe to a 30-day plan.</p>
            <Link href="/"
              className="inline-block bg-[var(--color-brand-primary)] text-white font-semibold text-sm px-6 py-2.5 rounded-[var(--radius-btn)] hover:opacity-90">
              Explore messes →
            </Link>
          </div>
        )}

        {/* 7-day menu calendar */}
        {subscription && restaurant && (
          <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">This Week&apos;s Menu</h2>
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, offset) => {
                const dayIdx = (today + offset) % 7;
                const daySlots = weekMenu[dayIdx];
                const isToday = offset === 0;
                return (
                  <div key={offset}
                    className={`rounded-[var(--radius-btn)] border px-4 py-3 ${isToday ? "border-[var(--color-brand-primary)] bg-orange-50" : "border-[var(--color-border)]"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold ${isToday ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)]"}`}>
                        {DAYS[dayIdx]}
                      </span>
                      {isToday && (
                        <span className="text-xs bg-[var(--color-brand-primary)] text-white rounded-full px-2 py-0.5">Today</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {slots.includes("lunch")  && <MiniSlot label="Lunch"  dish={daySlots?.lunch} />}
                      {slots.includes("dinner") && <MiniSlot label="Dinner" dish={daySlots?.dinner} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="text-xs text-[var(--color-text-muted)] mb-0.5">{label}</p>
      <p className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>
    </div>
  );
}

function MiniSlot({ label, dish }: { label: string; dish?: Dish | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--color-text-muted)] w-12 shrink-0">{label}</span>
      {dish ? (
        <>
          <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">{dish.name}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
            dish.diet_type === "veg"    ? "bg-green-100 text-green-700"  :
            dish.diet_type === "nonveg" ? "bg-red-100 text-red-700"      :
                                          "bg-orange-100 text-orange-700"
          }`}>{dish.diet_type}</span>
        </>
      ) : (
        <span className="text-xs text-[var(--color-text-muted)]">—</span>
      )}
    </div>
  );
}
