import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { randomUUID } from "crypto";

type CookieEntry = { name: string; value: string; options: Record<string, unknown> };

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function POST(request: NextRequest) {
  const body     = await request.formData();
  const username = String(body.get("username") ?? "").trim().toLowerCase();
  const password = String(body.get("password") ?? "");
  const role     = String(body.get("role")     ?? "student") as Role;

  // Profile fields (shared)
  const name      = String(body.get("name")      ?? "").trim();
  const location  = String(body.get("location")  ?? "").trim() || null;
  const diet_pref = String(body.get("diet_pref") ?? "").trim() || null;

  // Restaurant-only fields (go into restaurants table, NOT profiles)
  const restaurant_name = String(body.get("restaurant_name") ?? "").trim() || null;
  const area            = String(body.get("area")            ?? "").trim() || null;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3–20 characters: lowercase letters, numbers, underscores only." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }
  if (role === "restaurant" && !restaurant_name) {
    return NextResponse.json({ error: "Mess / restaurant name is required." }, { status: 400 });
  }

  // ── Check username uniqueness via service role (bypasses RLS) ───────────────
  const service = createServiceClient();
  const { data: taken } = await service
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (taken) {
    return NextResponse.json(
      { error: "Username is already taken. Please choose another." },
      { status: 409 }
    );
  }

  // ── Create auth user ─────────────────────────────────────────────────────────
  const email          = `${username}@tiffino.local`;
  const pendingCookies: CookieEntry[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            pendingCookies.push({ name, value, options: options ?? {} })
          );
        },
      },
    }
  );

  const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  if (!authData.session) {
    return NextResponse.json(
      {
        error:
          'Email confirmation is still enabled. In Supabase: Authentication → Providers → Email → toggle "Confirm email" OFF, then try again.',
      },
      { status: 400 }
    );
  }

  const userId = authData.user!.id;

  // ── Create profile (only real columns: id, username, email, role, name, location, diet_pref) ──
  const { error: profileError } = await service.from("profiles").upsert(
    { id: userId, username, email, role, name, location, diet_pref },
    { onConflict: "id" }
  );
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // ── For restaurant role: also create a restaurants row ──────────────────────
  if (role === "restaurant") {
    const { error: restError } = await service.from("restaurants").insert({
      owner_id:      userId,
      name:          restaurant_name!,
      area:          area ?? "",
      base_price:    0,
      serves_lunch:  true,
      serves_dinner: true,
      qr_token:      randomUUID(),
    });
    if (restError) {
      return NextResponse.json({ error: restError.message }, { status: 500 });
    }
  }

  const dest = role === "student" ? "/student/dashboard" : "/restaurant/dashboard";

  // Attach session cookies to the JSON response — browser stores them before
  // window.location.href fires, so the next request carries the session.
  const res = NextResponse.json({ redirect: dest });
  pendingCookies.forEach(({ name, value, options }) =>
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
  );
  return res;
}
