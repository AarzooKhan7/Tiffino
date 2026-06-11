"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
