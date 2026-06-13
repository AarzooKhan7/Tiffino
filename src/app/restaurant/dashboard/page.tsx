import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import QRCode from "qrcode";
import RestaurantQR from "@/components/RestaurantQR";
import { nowIST } from "@/lib/ist";

// Must be dynamic — page has auth-based redirects
export const dynamic = "force-dynamic";

const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

interface DishInfo { name: string; diet_type: string }

function extractDish(raw: unknown): DishInfo | null {
  if (!raw) return null;
  const d = Array.isArray(raw) ? raw[0] : raw;
  if (!d || typeof d !== "object") return null;
  const obj = d as Record<string, unknown>;
  return { name: String(obj.name ?? ""), diet_type: String(obj.diet_type ?? "") };
}

export default async function RestaurantDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  // Parallel: profile + restaurant
  const [{ data: profile }, { data: restaurant }] = await Promise.all([
    supabase.from("profiles").select("name, role").eq("id", user.id).single(),
    supabase.from("restaurants").select("id, name, area, base_price, serves_lunch, serves_dinner, qr_token").eq("owner_id", user.id).single(),
  ]);

  if (!profile || profile.role !== "restaurant") redirect("/");

  // Ensure restaurant has a qr_token; generate one if missing (fallback for old rows)
  let qrToken = restaurant?.qr_token as string | null;
  if (restaurant && !qrToken) {
    qrToken = randomUUID();
    const service = createServiceClient();
    await service.from("restaurants").update({ qr_token: qrToken }).eq("id", restaurant.id);
  }

  // Single IST snapshot for today
  const todayIdx = (nowIST().getDay() + 6) % 7;

  // Parallelise QR generation + menu fetch
  const [qrDataUrl, { data: todayMenu }] = await Promise.all([
    qrToken
      ? QRCode.toDataURL(qrToken, { width: 300, margin: 2, color: { dark: "#1a1a1a", light: "#ffffff" } })
      : Promise.resolve(null as string | null),
    restaurant
      ? supabase
          .from("weekly_menu")
          .select("meal_type, dish:dish_id(name, diet_type)")
          .eq("restaurant_id", restaurant.id)
          .eq("day_of_week", todayIdx)
      : Promise.resolve({ data: null }),
  ]);

  const today = todayIdx;
  const todayDateStr = nowIST().toISOString().slice(0, 10);

  const lunchRow   = (todayMenu ?? []).find((r) => r.meal_type === "lunch");
  const dinnerRow  = (todayMenu ?? []).find((r) => r.meal_type === "dinner");
  const lunchDish  = extractDish(lunchRow?.dish);
  const dinnerDish = extractDish(dinnerRow?.dish);

  // Kitchen demand forecast — live from DB
  interface ForecastSlot { expected: number; skipped: number; taken: number }
  let lunchForecast: ForecastSlot = { expected: 0, skipped: 0, taken: 0 };
  let dinnerForecast: ForecastSlot = { expected: 0, skipped: 0, taken: 0 };
  let materialRows: { material: string; qty_per_serving: number; unit: string; dish_id: string }[] = [];

  if (restaurant) {
    const service = createServiceClient();
    const lunchDishId = lunchRow ? (Array.isArray(lunchRow.dish) ? (lunchRow.dish[0] as { id?: string } | null)?.id : (lunchRow.dish as { id?: string } | null)?.id) : null;
    const dinnerDishId = dinnerRow ? (Array.isArray(dinnerRow.dish) ? (dinnerRow.dish[0] as { id?: string } | null)?.id : (dinnerRow.dish as { id?: string } | null)?.id) : null;
    const dishIds = [lunchDishId, dinnerDishId].filter(Boolean) as string[];

    const [{ data: activeSubs }, { data: todayRedemptions }, { data: materials }] = await Promise.all([
      service
        .from("subscriptions")
        .select("slots")
        .eq("restaurant_id", restaurant.id)
        .eq("status", "active"),
      service
        .from("redemptions")
        .select("meal_type, status")
        .eq("restaurant_id", restaurant.id)
        .eq("meal_date", todayDateStr),
      dishIds.length > 0
        ? service
            .from("material_requirements")
            .select("material, qty_per_serving, unit, dish_id")
            .in("dish_id", dishIds)
        : Promise.resolve({ data: [] }),
    ]);

    for (const sub of activeSubs ?? []) {
      const slots = (sub.slots as string[] | null) ?? [];
      if (slots.includes("lunch"))  lunchForecast.expected++;
      if (slots.includes("dinner")) dinnerForecast.expected++;
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
    materialRows = (materials ?? []) as typeof materialRows;
  }

  return (
    <div className="space-y-4">
      <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
        <p className="text-sm text-[var(--color-text-muted)]">Welcome back,</p>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-0.5">
          {profile.name ?? "Restaurant Owner"}
        </h1>
        {restaurant && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--color-brand-secondary)] text-white text-xs font-semibold px-3 py-1">
              🍽 {restaurant.name}
            </span>
            <span className="rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs px-3 py-1 border border-[var(--color-border)]">
              📍 {restaurant.area}
            </span>
            <span className="rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs px-3 py-1 border border-[var(--color-border)]">
              ₹{restaurant.base_price}/slot
            </span>
          </div>
        )}
      </div>

      {!restaurant && (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-8 text-center">
          <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Complete your restaurant setup</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">Add your details so students can find and subscribe to you.</p>
          <Link href="/restaurant/setup"
            className="inline-block bg-[var(--color-brand-primary)] text-white font-semibold text-sm px-6 py-2.5 rounded-[var(--radius-btn)] hover:opacity-90 transition-opacity">
            Set up restaurant →
          </Link>
        </div>
      )}

      {restaurant && qrDataUrl && (
        <RestaurantQR qrDataUrl={qrDataUrl} restaurantName={restaurant.name} />
      )}

      {restaurant && (
        <>
          <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">
              Today&apos;s Menu — {DAY_NAMES[today]}
            </h2>
            {(!lunchDish && !dinnerDish) ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No menu set for today.{" "}
                <Link href="/restaurant/menu" className="text-[var(--color-brand-secondary)] hover:underline font-medium">
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

          {/* Kitchen demand forecast */}
          <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Kitchen demand — today</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">Expected meals based on active subscriptions</p>
            <div className="grid grid-cols-2 gap-3">
              {restaurant.serves_lunch && (
                <ForecastCard slot="Lunch" dish={lunchDish} forecast={lunchForecast} />
              )}
              {restaurant.serves_dinner && (
                <ForecastCard slot="Dinner" dish={dinnerDish} forecast={dinnerForecast} />
              )}
            </div>
            {materialRows.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Raw material estimate</p>
                <div className="space-y-1.5">
                  {materialRows.map((m, i) => {
                    const isLunch  = lunchRow  && (Array.isArray(lunchRow.dish) ? (lunchRow.dish[0] as {id?:string}|null)?.id : (lunchRow.dish as {id?:string}|null)?.id) === m.dish_id;
                    const remaining = isLunch
                      ? Math.max(0, lunchForecast.expected - lunchForecast.skipped - lunchForecast.taken)
                      : Math.max(0, dinnerForecast.expected - dinnerForecast.skipped - dinnerForecast.taken);
                    const total = (m.qty_per_serving * remaining).toFixed(1);
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-text-primary)]">{m.material}</span>
                        <span className="font-semibold text-[var(--color-text-secondary)]">{total} {m.unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: "/restaurant/menu",        emoji: "📅", label: "Edit Weekly Menu" },
              { href: "/restaurant/dishes",       emoji: "🍲", label: "Manage Dishes" },
              { href: "/restaurant/subscribers",  emoji: "👥", label: "View Subscribers" },
            ].map(({ href, emoji, label }) => (
              <Link key={href} href={href}
                className="card-shadow rounded-[var(--radius-card)] bg-white px-4 py-4 flex flex-col gap-1 hover:shadow-md transition-shadow">
                <span className="text-2xl">{emoji}</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
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
    <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{slot}</p>
        {dish && <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-[80px]">{dish.name}</span>}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-extrabold text-[var(--color-text-primary)] leading-none">{remaining}</span>
        <span className="text-xs text-[var(--color-text-muted)] mb-0.5">remaining</span>
      </div>
      <div className="h-1.5 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
        <div className="h-full bg-[var(--color-brand-secondary)] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)]">
        {forecast.taken} served · {forecast.skipped} skipped · {forecast.expected} total
      </p>
    </div>
  );
}

function MealCard({ slot, dish }: { slot: string; dish: DishInfo | null }) {
  return (
    <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-3">
      <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">{slot}</p>
      {dish ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-[var(--color-text-primary)]">{dish.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            dish.diet_type === "veg"    ? "bg-green-100 text-green-700"  :
            dish.diet_type === "nonveg" ? "bg-red-100 text-red-700"      :
                                          "bg-orange-100 text-orange-700"
          }`}>{dish.diet_type}</span>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">Not set</p>
      )}
    </div>
  );
}
