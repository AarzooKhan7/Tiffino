"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateStudentProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/student");

  const name      = String(formData.get("name") ?? "").trim();
  const location  = String(formData.get("location") ?? "").trim() || null;
  const diet_pref = String(formData.get("diet_pref") ?? "").trim() || null;

  if (!name) throw new Error("Name is required");

  const { error } = await supabase
    .from("profiles")
    .update({ name, location, diet_pref })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/student/profile");
  redirect("/student/profile");
}
