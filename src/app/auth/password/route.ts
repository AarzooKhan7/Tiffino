import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Role } from "@/lib/types";

type CookieEntry = { name: string; value: string; options: Record<string, unknown> };

export async function POST(request: NextRequest) {
  const body  = await request.formData();
  const email    = String(body.get("email")    ?? "").trim();
  const password = String(body.get("password") ?? "");
  const mode     = String(body.get("mode")     ?? "login") as "login" | "signup";
  const role     = String(body.get("role")     ?? "student") as Role;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Collect every Set-Cookie the Supabase client wants to write.
  // We'll attach them manually to the response — same trick as /auth/callback.
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

  let userId: string;
  let userEmail: string;

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (!data.session) {
      // Supabase "Confirm email" is still ON in the dashboard
      return NextResponse.json({ needsEmailConfirm: true });
    }
    userId    = data.user!.id;
    userEmail = data.user!.email ?? email;
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    userId    = data.user.id;
    userEmail = data.user.email ?? email;
  }

  // Check / create profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  let dest: string;
  if (existing) {
    dest = existing.role === "student" ? "/student/dashboard" : "/restaurant/dashboard";
  } else {
    await supabase
      .from("profiles")
      .upsert({ id: userId, role, email: userEmail }, { onConflict: "id" });
    dest = "/onboarding";
  }

  // Return the destination URL as JSON with all session cookies attached.
  // The client will navigate after the fetch resolves — cookies are guaranteed
  // to be stored by the browser before window.location.href fires.
  const res = NextResponse.json({ redirect: dest });
  pendingCookies.forEach(({ name, value, options }) =>
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
  );
  return res;
}
