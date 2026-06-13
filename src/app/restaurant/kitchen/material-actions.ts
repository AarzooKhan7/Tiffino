"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getRestaurantId(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", userId)
    .single();
  return data?.id ?? null;
}

async function getDishRestaurantId(dishId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dishes")
    .select("restaurant_id")
    .eq("id", dishId)
    .single();
  return (data?.restaurant_id as string) ?? null;
}

export async function upsertMaterial(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const dishId       = String(formData.get("dish_id") ?? "").trim();
  const matName      = String(formData.get("material_name") ?? "").trim();
  const quantityRaw  = formData.get("quantity_g");
  const unit         = String(formData.get("unit") ?? "g").trim();
  const existingId   = String(formData.get("id") ?? "").trim() || null;

  if (!dishId || !matName || !quantityRaw) return;
  const quantity_g = parseFloat(String(quantityRaw));
  if (isNaN(quantity_g) || quantity_g <= 0) return;

  // Authorise: dish must belong to owner's restaurant
  const restaurantId = await getRestaurantId(user.id);
  const dishRestId   = await getDishRestaurantId(dishId);
  if (!restaurantId || restaurantId !== dishRestId) return;

  if (existingId) {
    await supabase
      .from("material_requirements")
      .update({ material_name: matName, quantity_g, unit })
      .eq("id", existingId)
      .eq("dish_id", dishId);
  } else {
    await supabase.from("material_requirements").insert({
      dish_id: dishId,
      material_name: matName,
      quantity_g,
      unit,
    });
  }

  revalidatePath("/restaurant/kitchen");
  revalidatePath("/restaurant/dishes");
  redirect(`/restaurant/kitchen?dish=${dishId}&saved=1`);
}

export async function deleteMaterial(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id     = String(formData.get("id") ?? "");
  const dishId = String(formData.get("dish_id") ?? "");

  const restaurantId = await getRestaurantId(user.id);
  const dishRestId   = await getDishRestaurantId(dishId);
  if (!restaurantId || restaurantId !== dishRestId) return;

  await supabase.from("material_requirements").delete().eq("id", id).eq("dish_id", dishId);

  revalidatePath("/restaurant/kitchen");
  redirect(`/restaurant/kitchen?dish=${dishId}`);
}
