"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export interface PasswordAuthState {
  error: string | null;
  needsEmailConfirm: boolean;
}

export async function passwordAuth(
  _prev: PasswordAuthState,
  formData: FormData
): Promise<PasswordAuthState> {
  const email    = String(formData.get("email")    ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const mode     = String(formData.get("mode")     ?? "login") as "login" | "signup";
  const role     = String(formData.get("role")     ?? "student") as Role;

  if (!email || !password) {
    return { error: "Email and password are required.", needsEmailConfirm: false };
  }

  // createClient() uses cookies() from next/headers — in a Server Action
  // context, cookies().set() IS effective and is sent with the response.
  const supabase = await createClient();

  let userId: string;
  let userEmail: string;

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message, needsEmailConfirm: false };

    // If Supabase's "Confirm email" is ON, session will be null
    if (!data.session) {
      return { error: null, needsEmailConfirm: true };
    }
    userId    = data.user!.id;
    userEmail = data.user!.email ?? email;
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message, needsEmailConfirm: false };
    userId    = data.user.id;
    userEmail = data.user.email ?? email;
  }

  // Check if a profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  let dest: string;

  if (existing) {
    dest = existing.role === "student" ? "/student/dashboard" : "/restaurant/dashboard";
  } else {
    const { error: upsertError } = await supabase.from("profiles").upsert(
      { id: userId, role, email: userEmail },
      { onConflict: "id" }
    );
    if (upsertError) return { error: upsertError.message, needsEmailConfirm: false };
    dest = "/onboarding";
  }

  // redirect() in a Server Action causes a full navigation;
  // cookies set by createClient() above travel with it automatically.
  redirect(dest);
}
