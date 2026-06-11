"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function upsertRestaurant(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const serves_lunch  = formData.get("serves_lunch")  === "on";
  const serves_dinner = formData.get("serves_dinner") === "on";

  const payload = {
    name:    String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    area:    String(formData.get("area") ?? "").trim(),
    base_price:           Number(formData.get("base_price")),
    serves_lunch,
    serves_dinner,
    lunch_skip_cutoff:  serves_lunch  ? String(formData.get("lunch_skip_cutoff"))  : null,
    dinner_skip_cutoff: serves_dinner ? String(formData.get("dinner_skip_cutoff")) : null,
  };

  // Safe upsert: check for existing row first (no unique-constraint assumption)
  const { data: existing } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  let dbError;
  if (existing) {
    const { error } = await supabase.from("restaurants").update(payload).eq("id", existing.id);
    dbError = error;
  } else {
    const { error } = await supabase
      .from("restaurants")
      .insert({ ...payload, owner_id: user.id });
    dbError = error;
  }

  if (dbError) throw new Error(dbError.message);
  redirect("/restaurant/dashboard");
}
