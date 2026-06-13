import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MenuBuilder from "./MenuBuilder";

export const dynamic = "force-dynamic";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, serves_lunch, serves_dinner, lunch_price, dinner_price, bundle_price")
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/restaurant/setup");

  const rest = restaurant as Record<string, unknown>;

  const [{ data: dishes }, { data: existingMenu }] = await Promise.all([
    supabase
      .from("dishes")
      .select("id, name, diet_type")
      .eq("restaurant_id", restaurant.id)
      .order("name"),
    supabase
      .from("weekly_menu")
      .select("day_of_week, meal_type, dish_id")
      .eq("restaurant_id", restaurant.id),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Weekly Menu</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Set once — repeats every week. Assign a dish per slot per day.
        </p>
      </div>

      {(!dishes || dishes.length === 0) ? (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-[var(--color-text-muted)] text-sm mb-4">
            Add dishes to your library before building a menu.
          </p>
          <a href="/restaurant/dishes"
            className="inline-block bg-[var(--color-brand-primary)] text-white text-sm font-semibold px-5 py-2.5 rounded-[var(--radius-btn)] hover:opacity-90 transition-opacity">
            Go to Dish Library →
          </a>
        </div>
      ) : (
        <MenuBuilder
          restaurantId={restaurant.id}
          servesLunch={restaurant.serves_lunch}
          servesDinner={restaurant.serves_dinner}
          dishes={dishes ?? []}
          initialMenu={existingMenu ?? []}
          lunchPrice={Number(rest.lunch_price ?? 1500)}
          dinnerPrice={Number(rest.dinner_price ?? 1500)}
          bundlePrice={rest.bundle_price !== null && rest.bundle_price !== undefined ? Number(rest.bundle_price) : null}
          savedParam={saved ?? null}
        />
      )}
    </div>
  );
}
