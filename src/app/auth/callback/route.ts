import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // role is passed as a query param we add to the redirectTo URL
  const roleParam = (searchParams.get("role") ?? "student") as Role;

  const supabase = await createClient();

  let sessionError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) sessionError = error.message;
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as "magiclink" | "email" });
    if (error) sessionError = error.message;
  } else {
    sessionError = "Missing auth parameters";
  }

  if (sessionError) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(sessionError)}`);
  }

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/`);
  }

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (existing) {
    // Already has a profile — go straight to their dashboard
    const dest = existing.role === "student" ? "/student/dashboard" : "/restaurant/dashboard";
    return NextResponse.redirect(`${origin}${dest}`);
  }

  // First login — create profile with the role they came in via, then send to onboarding
  // We only set id + role here; onboarding fills in the rest
  const { error: upsertError } = await supabase.from("profiles").upsert(
    { id: user.id, role: roleParam, email: user.email },
    { onConflict: "id" }
  );

  if (upsertError) {
    // Role value was rejected by CHECK constraint or another DB error
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent("Profile creation failed: " + upsertError.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
