import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubscribePanel from "@/components/SubscribePanel";

export const revalidate = 60;

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function todayIST(): number {
  return (new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay() + 6) % 7;
}

export default async function PublicRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Parallel: restaurant + user
  const [{ data: restaurant }, { data: { user } }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, area, address, base_price, serves_lunch, serves_dinner")
      .eq("id", id)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!restaurant) notFound();

  // Fetch menu (and optionally active subscription if student)
  const menuPromise = supabase
    .from("weekly_menu")
    .select("day_of_week, meal_type, dish:dish_id(name, diet_type, description)")
    .eq("restaurant_id", id)
    .order("day_of_week")
    .order("meal_type");

  const profilePromise = user
    ? supabase.from("profiles").select("role").eq("id", user.id).single()
    : Promise.resolve({ data: null });

  const [{ data: menuRows }, { data: profile }] = await Promise.all([menuPromise, profilePromise]);

  const isStudent = profile?.role === "student";

  // Check active subscription (only for students)
  let hasActiveSub = false;
  if (isStudent && user) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("student_id", user.id)
      .eq("restaurant_id", id)
      .eq("status", "active")
      .maybeSingle();
    hasActiveSub = !!sub;
  }

  const today = todayIST();

  // Group menu by day
  const byDay: Record<number, Record<string, { name: string; diet_type: string } | null>> = {};
  for (const row of menuRows ?? []) {
    if (!byDay[row.day_of_week]) byDay[row.day_of_week] = {};
    const dish = Array.isArray(row.dish) ? row.dish[0] : row.dish;
    byDay[row.day_of_week][row.meal_type] = dish as { name: string; diet_type: string } | null;
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface-alt)]">
      <div className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="text-sm text-[var(--color-brand-secondary)] hover:underline mb-3 inline-block">
            ← Back to all messes
          </Link>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)]">{restaurant.name}</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            📍 {restaurant.area}{restaurant.address ? ` · ${restaurant.address}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-sm font-bold text-[var(--color-brand-secondary)]">
              ₹{restaurant.base_price}<span className="text-xs font-normal text-[var(--color-text-muted)]">/slot/day</span>
            </span>
            {restaurant.serves_lunch  && <span className="text-xs border border-[var(--color-border)] rounded-full px-2 py-0.5 text-[var(--color-text-secondary)]">🌞 Lunch</span>}
            {restaurant.serves_dinner && <span className="text-xs border border-[var(--color-border)] rounded-full px-2 py-0.5 text-[var(--color-text-secondary)]">🌙 Dinner</span>}
          </div>

          {/* CTA: show subscribe panel for students, login link for guests */}
          {isStudent && !hasActiveSub && (
            <SubscribePanel
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              basePrice={restaurant.base_price}
              servesLunch={restaurant.serves_lunch}
              servesDinner={restaurant.serves_dinner}
            />
          )}
          {isStudent && hasActiveSub && (
            <div className="mt-4 rounded-[var(--radius-card)] bg-green-50 border border-green-200 px-5 py-3">
              <p className="text-green-700 font-semibold text-sm">✅ You&apos;re subscribed to this mess</p>
              <Link href="/student/dashboard" className="text-xs text-green-600 hover:underline">View your plan →</Link>
            </div>
          )}
          {!user && (
            <Link href="/auth/student"
              className="inline-block mt-4 bg-[var(--color-brand-primary)] text-white font-semibold text-sm px-5 py-2.5 rounded-[var(--radius-btn)] hover:opacity-90">
              Sign in to subscribe — ₹{restaurant.base_price}/slot/day
            </Link>
          )}
          {user && !isStudent && (
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">Only student accounts can subscribe.</p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Weekly Menu</h2>

        {Object.keys(byDay).length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Menu not published yet.</p>
        ) : (
          <div className="space-y-3">
            {DAYS.map((dayName, dayIdx) => {
              const slots = byDay[dayIdx];
              const isToday = dayIdx === today;
              if (!slots) return null;
              return (
                <div key={dayIdx}
                  className={`card-shadow rounded-[var(--radius-card)] bg-white px-5 py-4 ${isToday ? "ring-2 ring-[var(--color-brand-primary)]" : ""}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{dayName}</h3>
                    {isToday && (
                      <span className="text-xs bg-[var(--color-brand-primary)] text-white rounded-full px-2 py-0.5 font-medium">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {restaurant.serves_lunch  && <SlotCell label="Lunch"  dish={slots.lunch} />}
                    {restaurant.serves_dinner && <SlotCell label="Dinner" dish={slots.dinner} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function SlotCell({ label, dish }: { label: string; dish?: { name: string; diet_type: string } | null }) {
  return (
    <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2">
      <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">{label}</p>
      {dish ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">{dish.name}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
            dish.diet_type === "veg"    ? "bg-green-100 text-green-700"  :
            dish.diet_type === "nonveg" ? "bg-red-100 text-red-700"      :
                                          "bg-orange-100 text-orange-700"
          }`}>{dish.diet_type}</span>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">—</p>
      )}
    </div>
  );
}
