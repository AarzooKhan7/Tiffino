import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import HomeClient, { type HomeListing } from "@/components/HomeClient";
import { restaurantRating } from "@/lib/food-images";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: restaurants }, { data: { user } }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, area, lunch_price, dinner_price, serves_lunch, serves_dinner")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  let userName: string | null = null;
  let role: "student" | "restaurant" | null = null;
  if (user) {
    const { data: p } = await supabase.from("profiles").select("name, role").eq("id", user.id).single();
    userName = p?.name ?? null;
    role = (p?.role as "student" | "restaurant") ?? null;
  }

  // Attach deterministic fake rating (will be replaced with real avg once reviews table exists)
  const listings: HomeListing[] = (restaurants ?? []).map((r) => ({
    id:           r.id,
    name:         r.name,
    area:         r.area,
    lunch_price:  Number(r.lunch_price  ?? 1500),
    dinner_price: Number(r.dinner_price ?? 1500),
    serves_lunch:  r.serves_lunch,
    serves_dinner: r.serves_dinner,
    avg_rating:   parseFloat(restaurantRating(r.id)),
    review_count: 0,
  }));

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      <AppHeader userName={userName} role={role} />
      <HomeClient restaurants={listings} isLoggedIn={!!user} />
    </div>
  );
}
