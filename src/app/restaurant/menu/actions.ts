"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function savePricing(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const lunch_price  = Number(formData.get("lunch_price"))  || 1500;
  const dinner_price = Number(formData.get("dinner_price")) || 1500;
  const bundle_price = Number(formData.get("bundle_price")) || null;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!restaurant) redirect("/restaurant/setup");

  const payload: Record<string, unknown> = { lunch_price, dinner_price };
  if (bundle_price !== null) payload.bundle_price = bundle_price;

  const { error } = await supabase.from("restaurants").update(payload).eq("id", restaurant.id);
  if (error) throw new Error(error.message);

  revalidatePath("/restaurant/menu");
  redirect("/restaurant/menu?saved=pricing");
}

interface MenuCell {
  day_of_week: number;   // 0=Monday … 6=Sunday
  meal_type: "lunch" | "dinner";
  dish_id: string;
}

export async function saveWeeklyMenu(restaurantId: string, cells: MenuCell[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  // Verify ownership
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_id", user.id)
    .single();
  if (!restaurant) throw new Error("Restaurant not found or access denied");

  // Replace-all strategy: delete existing rows then insert new ones
  const { error: delError } = await supabase
    .from("weekly_menu")
    .delete()
    .eq("restaurant_id", restaurantId);
  if (delError) throw new Error(delError.message);

  if (cells.length > 0) {
    const rows = cells.map(({ day_of_week, meal_type, dish_id }) => ({
      restaurant_id: restaurantId,
      day_of_week,
      meal_type,
      dish_id,
    }));
    const { error: insError } = await supabase.from("weekly_menu").insert(rows);
    if (insError) throw new Error(insError.message);
  }

  revalidatePath("/restaurant/menu");
  revalidatePath("/restaurant/dashboard");
}
