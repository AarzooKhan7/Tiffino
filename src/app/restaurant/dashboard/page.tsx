import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function todayIST(): number {
  return (new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay() + 6) % 7;
}

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

  // Parallel: profile + restaurant in one round trip
  const [{ data: profile }, { data: restaurant }] = await Promise.all([
    supabase.from("profiles").select("name, role").eq("id", user.id).single(),
    supabase.from("restaurants").select("id, name, area, base_price, serves_lunch, serves_dinner").eq("owner_id", user.id).single(),
  ]);

  if (!profile || profile.role !== "restaurant") redirect("/");

  const today = todayIST();

  const { data: todayMenu } = restaurant
    ? await supabase
        .from("weekly_menu")
        .select("meal_type, dish:dish_id(name, diet_type)")
        .eq("restaurant_id", restaurant.id)
        .eq("day_of_week", today)
    : { data: null };

  const lunchRow   = (todayMenu ?? []).find((r) => r.meal_type === "lunch");
  const dinnerRow  = (todayMenu ?? []).find((r) => r.meal_type === "dinner");
  const lunchDish  = extractDish(lunchRow?.dish);
  const dinnerDish = extractDish(dinnerRow?.dish);

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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: "/restaurant/menu",   emoji: "📅", label: "Edit Weekly Menu" },
              { href: "/restaurant/dishes", emoji: "🍲", label: "Manage Dishes" },
              { href: "/restaurant/setup",  emoji: "⚙️", label: "Restaurant Settings" },
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
