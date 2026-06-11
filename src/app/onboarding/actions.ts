"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeStudentOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const full_name = String(formData.get("full_name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const diet_preference = String(formData.get("diet_preference") ?? "").trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, location, diet_preference })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  redirect("/student/dashboard");
}

export async function completeRestaurantOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const full_name = String(formData.get("full_name") ?? "").trim();
  const restaurant_name = String(formData.get("restaurant_name") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, restaurant_name, area })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  redirect("/restaurant/dashboard");
}
