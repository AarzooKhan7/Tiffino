"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getRestaurantId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", userId)
    .single();
  return data?.id ?? null;
}

export async function upsertDish(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const restaurantId = await getRestaurantId(supabase, user.id);
  if (!restaurantId) redirect("/restaurant/setup");

  const id        = formData.get("id") as string | null;
  const name      = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const diet_type = String(formData.get("diet_type")) as "veg" | "nonveg" | "mix";
  const image_url = String(formData.get("image_url") ?? "").trim() || null;

  const payload = { name, description, diet_type, image_url, restaurant_id: restaurantId };

  let dbError;
  if (id) {
    // Edit: ensure dish belongs to this restaurant
    const { error } = await supabase
      .from("dishes")
      .update({ name, description, diet_type, image_url })
      .eq("id", id)
      .eq("restaurant_id", restaurantId);
    dbError = error;
  } else {
    const { error } = await supabase.from("dishes").insert(payload);
    dbError = error;
  }

  if (dbError) throw new Error(dbError.message);
  revalidatePath("/restaurant/dishes");
  redirect("/restaurant/dishes");
}

export async function deleteDish(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const restaurantId = await getRestaurantId(supabase, user.id);
  if (!restaurantId) return;

  const id = String(formData.get("id"));
  await supabase.from("dishes").delete().eq("id", id).eq("restaurant_id", restaurantId);

  revalidatePath("/restaurant/dishes");
  redirect("/restaurant/dishes");
}
