import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import SubscribePanel from "@/components/SubscribePanel";
import AppHeader from "@/components/AppHeader";
import ReviewForm from "@/components/ReviewForm";
import { restaurantCover } from "@/lib/food-images";

export const dynamic = "force-dynamic";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function todayIST(): number {
  return (new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay() + 6) % 7;
}

export default async function PublicRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: restaurant }, { data: { user } }] = await Promise.all([
    supabase.from("restaurants").select("id, name, area, address, lunch_price, dinner_price, bundle_price, serves_lunch, serves_dinner").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!restaurant) notFound();

  const [{ data: menuRows }, { data: profile }] = await Promise.all([
    supabase.from("weekly_menu").select("day_of_week, meal_type, dish:dish_id(name, diet_type, description)").eq("restaurant_id", id).order("day_of_week").order("meal_type"),
    user ? supabase.from("profiles").select("role, name, id").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  const isStudent = profile?.role === "student";
  let hasActiveSub = false;
  let hasAnySub = false;
  let myReview: { rating: number; comment: string | null } | null = null;

  if (isStudent && user) {
    const service = createServiceClient();
    const [{ data: activeSub }, { data: anySub }, { data: reviewRow }] = await Promise.all([
      supabase.from("subscriptions").select("id").eq("student_id", user.id).eq("restaurant_id", id).eq("status", "active").maybeSingle(),
      supabase.from("subscriptions").select("id").eq("student_id", user.id).eq("restaurant_id", id).limit(1).maybeSingle(),
      // Try to fetch existing review — will fail gracefully if reviews table doesn't exist yet
      service.from("reviews").select("rating, comment").eq("restaurant_id", id).eq("student_id", user.id).maybeSingle().then(
        (r) => r,
        () => ({ data: null })
      ),
    ]);
    hasActiveSub = !!activeSub;
    hasAnySub    = !!anySub;
    myReview     = reviewRow ? { rating: Number(reviewRow.rating), comment: reviewRow.comment as string | null } : null;
  }

  // Fetch reviews with reviewer name — graceful if table missing
  const service = createServiceClient();
  let reviews: { id: string; rating: number; comment: string | null; student_name: string; created_at: string }[] = [];
  let avgRating: number | null = null;
  try {
    const { data: reviewRows } = await service
      .from("reviews")
      .select("id, rating, comment, created_at, student:student_id(name)")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    reviews = (reviewRows ?? []).map((r) => {
      const s = Array.isArray(r.student) ? r.student[0] : r.student;
      return {
        id:           r.id as string,
        rating:       Number(r.rating),
        comment:      r.comment as string | null,
        student_name: (s as Record<string, unknown> | null)?.name as string ?? "Student",
        created_at:   r.created_at as string,
      };
    });
    if (reviews.length > 0) {
      avgRating = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
    }
  } catch {
    // reviews table not yet created — silently skip
  }

  const today = todayIST();
  const byDay: Record<number, Record<string, { name: string; diet_type: string } | null>> = {};
  for (const row of menuRows ?? []) {
    if (!byDay[row.day_of_week]) byDay[row.day_of_week] = {};
    const dish = Array.isArray(row.dish) ? row.dish[0] : row.dish;
    byDay[row.day_of_week][row.meal_type] = dish as { name: string; diet_type: string } | null;
  }

  const cover = restaurantCover(restaurant.id);
  const displayRating = avgRating ?? null;

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
            {displayRating !== null && (
              <div className="flex items-center gap-1.5 bg-green-600 rounded-full px-3 py-1.5 shadow-sm shrink-0">
                <span className="text-white text-xs">★</span>
                <span className="text-sm font-bold text-white">{displayRating.toFixed(1)}</span>
                <span className="text-white/70 text-[11px]">({reviews.length})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Info strip */}
        <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4 flex flex-wrap gap-4 items-center">
          <div>
            {restaurant.serves_lunch && restaurant.serves_dinner ? (
              <>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl font-extrabold text-[var(--color-brand-secondary)]">
                    ₹{Number(restaurant.lunch_price).toLocaleString()}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">lunch</span>
                  <span className="text-[var(--color-text-muted)]">·</span>
                  <span className="text-xl font-extrabold text-[var(--color-brand-secondary)]">
                    ₹{Number(restaurant.dinner_price).toLocaleString()}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">dinner</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">per month · 30 tokens/slot</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[var(--color-brand-secondary)]">
                    ₹{Number(restaurant.serves_lunch ? restaurant.lunch_price : restaurant.dinner_price).toLocaleString()}
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">/ month</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">30 tokens included</p>
              </>
            )}
          </div>
          <div className="flex gap-2 ml-auto flex-wrap">
            {restaurant.serves_lunch  && <span className="text-xs border border-[var(--color-border)] rounded-full px-3 py-1 text-[var(--color-text-secondary)] font-medium">🌞 Lunch</span>}
            {restaurant.serves_dinner && <span className="text-xs border border-[var(--color-border)] rounded-full px-3 py-1 text-[var(--color-text-secondary)] font-medium">🌙 Dinner</span>}
          </div>
        </div>

        {/* Subscribe / status */}
        {isStudent && !hasActiveSub && (
          <SubscribePanel
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            servesLunch={restaurant.serves_lunch}
            servesDinner={restaurant.serves_dinner}
            lunchPrice={Number(restaurant.lunch_price)}
            dinnerPrice={Number(restaurant.dinner_price)}
            bundlePrice={restaurant.bundle_price !== null && restaurant.bundle_price !== undefined ? Number(restaurant.bundle_price) : null}
          />
        )}
        {isStudent && hasActiveSub && (
          <div className="rounded-[var(--radius-card)] bg-green-50 border border-green-200 px-5 py-4 flex items-center justify-between gap-3">
            <p className="text-green-700 font-semibold text-sm">✅ You&apos;re subscribed to this mess</p>
            <Link href="/student/dashboard" className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full font-semibold hover:bg-green-700 transition-colors shrink-0">
              View plan →
            </Link>
          </div>
        )}
        {!user && (
          <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">Ready to subscribe?</p>
              <p className="text-sm text-[var(--color-text-muted)]">Sign in as a student to get started.</p>
            </div>
            <a href="/auth/student" className="btn-primary px-5 py-2.5 whitespace-nowrap shrink-0 text-sm">Sign in &amp; Subscribe</a>
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

        {/* Reviews section */}
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">
            Reviews{reviews.length > 0 && <span className="text-sm font-normal text-[var(--color-text-muted)] ml-2">({reviews.length})</span>}
          </h2>

          {/* Write/update review (only for students with a subscription) */}
          {isStudent && hasAnySub && (
            <div className="mb-4">
              <ReviewForm
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                existingRating={myReview?.rating}
                existingComment={myReview?.comment ?? undefined}
              />
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-8 text-center">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm text-[var(--color-text-muted)]">No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-[var(--radius-card)] card-shadow-sm px-5 py-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-xs font-bold text-[var(--color-brand-primary)] shrink-0">
                        {r.student_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{r.student_name}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className={`text-sm ${r.rating >= s ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{r.comment}</p>}
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-2">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
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
