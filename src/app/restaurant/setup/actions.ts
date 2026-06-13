"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function upsertRestaurant(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  // Update owner display name if provided
  const ownerName = String(formData.get("owner_name") ?? "").trim();
  if (ownerName) {
    await supabase.from("profiles").update({ name: ownerName }).eq("id", user.id);
  }

  const serves_lunch  = formData.get("serves_lunch")  === "on";
  const serves_dinner = formData.get("serves_dinner") === "on";

  const payload = {
    name:               String(formData.get("name") ?? "").trim(),
    address:            String(formData.get("address") ?? "").trim(),
    area:               String(formData.get("area") ?? "").trim(),
    lunch_price:        Number(formData.get("lunch_price"))  || 1500,
    dinner_price:       Number(formData.get("dinner_price")) || 1500,
    serves_lunch,
    serves_dinner,
    lunch_skip_cutoff:  serves_lunch  ? String(formData.get("lunch_skip_cutoff"))  : null,
    dinner_skip_cutoff: serves_dinner ? String(formData.get("dinner_skip_cutoff")) : null,
  };

  const { data: existing } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

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
