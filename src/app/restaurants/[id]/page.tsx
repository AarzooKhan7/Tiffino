import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubscribePanel from "@/components/SubscribePanel";
import AppHeader from "@/components/AppHeader";
import { restaurantCover, restaurantRating } from "@/lib/food-images";

export const dynamic = "force-dynamic";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function todayIST(): number {
  return (new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay() + 6) % 7;
}

export default async function PublicRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: restaurant }, { data: { user } }] = await Promise.all([
    supabase.from("restaurants").select("id, name, area, address, base_price, serves_lunch, serves_dinner").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!restaurant) notFound();

  const [{ data: menuRows }, { data: profile }] = await Promise.all([
    supabase.from("weekly_menu").select("day_of_week, meal_type, dish:dish_id(name, diet_type, description)").eq("restaurant_id", id).order("day_of_week").order("meal_type"),
    user ? supabase.from("profiles").select("role, name").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  const isStudent = profile?.role === "student";
  let hasActiveSub = false;
  if (isStudent && user) {
    const { data: sub } = await supabase.from("subscriptions").select("id").eq("student_id", user.id).eq("restaurant_id", id).eq("status", "active").maybeSingle();
    hasActiveSub = !!sub;
  }

  const today = todayIST();
  const byDay: Record<number, Record<string, { name: string; diet_type: string } | null>> = {};
  for (const row of menuRows ?? []) {
    if (!byDay[row.day_of_week]) byDay[row.day_of_week] = {};
    const dish = Array.isArray(row.dish) ? row.dish[0] : row.dish;
    byDay[row.day_of_week][row.meal_type] = dish as { name: string; diet_type: string } | null;
  }

  const cover = restaurantCover(restaurant.id);
  const rating = restaurantRating(restaurant.id);

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      <AppHeader userName={profile?.name ?? null} role={(profile?.role as "student" | "restaurant") ?? null} />

      {/* Hero */}
      <div className="relative h-[240px] sm:h-[300px] overflow-hidden bg-gradient-to-br from-orange-100 to-red-50">
        <Image src={cover} alt={restaurant.name} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <Link href="/" className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-black/50 transition-colors">
          ← Back
        </Link>
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow">{restaurant.name}</h1>
              <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {restaurant.area}{restaurant.address ? ` · ${restaurant.address}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm shrink-0">
              <svg className="w-3.5 h-3.5 text-green-600 fill-green-600" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span className="text-sm font-bold text-green-700">{rating}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Info strip */}
        <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4 flex flex-wrap gap-4 items-center">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[var(--color-brand-secondary)]">₹1,500</span>
              <span className="text-sm text-[var(--color-text-muted)]">/ slot / month</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">₹3,000 for both slots</p>
          </div>
          <div className="flex gap-2 ml-auto flex-wrap">
            {restaurant.serves_lunch  && <span className="text-xs border border-[var(--color-border)] rounded-full px-3 py-1 text-[var(--color-text-secondary)] font-medium">🌞 Lunch</span>}
            {restaurant.serves_dinner && <span className="text-xs border border-[var(--color-border)] rounded-full px-3 py-1 text-[var(--color-text-secondary)] font-medium">🌙 Dinner</span>}
          </div>
        </div>

        {isStudent && !hasActiveSub && (
          <SubscribePanel
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            servesLunch={restaurant.serves_lunch}
            servesDinner={restaurant.serves_dinner}
          />
        )}
        {isStudent && hasActiveSub && (
          <div className="rounded-[var(--radius-card)] bg-green-50 border border-green-200 px-5 py-4 flex items-center justify-between gap-3">
            <p className="text-green-700 font-semibold text-sm">✅ You&apos;re subscribed to this mess</p>
            <Link href="/student/dashboard" className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full font-semibold hover:bg-green-700 transition-colors">
              View plan →
            </Link>
          </div>
        )}
        {!user && (
          <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-5 flex flex-col sm:flex-row items-center gap-4">
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">Ready to subscribe?</p>
              <p className="text-sm text-[var(--color-text-muted)]">Sign in as a student to get started.</p>
            </div>
            <a href="/auth/student" className="btn-primary px-5 py-2.5 whitespace-nowrap shrink-0">Sign in &amp; Subscribe</a>
          </div>
        )}
        {user && !isStudent && (
          <p className="text-xs text-[var(--color-text-muted)] text-center">Only student accounts can subscribe.</p>
        )}

        {/* Weekly menu */}
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">Weekly Menu</h2>
          {Object.keys(byDay).length === 0 ? (
            <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-8 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm text-[var(--color-text-muted)]">Menu not published yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {DAYS.map((dayName, dayIdx) => {
                const slots = byDay[dayIdx];
                const isToday = dayIdx === today;
                if (!slots) return null;
                return (
                  <div key={dayIdx}
                    className={`bg-white rounded-[var(--radius-card)] card-shadow-sm px-5 py-4 border-l-4 ${isToday ? "border-l-[var(--color-brand-primary)]" : "border-l-transparent"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{dayName}</h3>
                      {isToday && <span className="text-[11px] bg-[var(--color-brand-primary)] text-white rounded-full px-2.5 py-0.5 font-semibold">Today</span>}
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
      </div>
    </div>
  );
}

function SlotCell({ label, dish }: { label: string; dish?: { name: string; diet_type: string } | null }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-alt)] px-3 py-2.5">
      {dish && (
        <span className={`diet-dot shrink-0 ${
          dish.diet_type === "veg" ? "diet-dot-veg" : dish.diet_type === "nonveg" ? "diet-dot-nonveg" : "diet-dot-mix"
        }`} />
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{label}</p>
        {dish ? (
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{dish.name}</p>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Not set</p>
        )}
      </div>
    </div>
  );
}
