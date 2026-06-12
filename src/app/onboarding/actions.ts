"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeStudentOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const name      = String(formData.get("name")      ?? "").trim();
  const location  = String(formData.get("location")  ?? "").trim();
  const diet_pref = String(formData.get("diet_pref") ?? "").trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ name, location, diet_pref })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  redirect("/student/dashboard");
}

export async function completeRestaurantOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const name            = String(formData.get("name")            ?? "").trim();
  const restaurant_name = String(formData.get("restaurant_name") ?? "").trim();
  const area            = String(formData.get("area")            ?? "").trim();

  // Update owner's display name on their profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", user.id);
  if (profileError) throw new Error(profileError.message);

  // Check if a restaurants row already exists
  const { data: existing } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (existing) {
    // Update existing row with the new name/area
    const { error } = await supabase
      .from("restaurants")
      .update({ name: restaurant_name, area })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    // Create new restaurants row with required fields
    const { error } = await supabase.from("restaurants").insert({
      owner_id:      user.id,
      name:          restaurant_name,
      area,
      base_price:    0,
      serves_lunch:  true,
      serves_dinner: true,
    });
    if (error) throw new Error(error.message);
  }

  redirect("/restaurant/dashboard");
}
