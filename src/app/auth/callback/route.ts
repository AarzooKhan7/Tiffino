import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Role } from "@/lib/types";

type CookieEntry = { name: string; value: string; options: Record<string, unknown> };

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const roleParam = (searchParams.get("role") ?? "student") as Role;

  // On Vercel the internal URL can differ from the public one; x-forwarded-host is the truth
  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin = forwardedHost ? `https://${forwardedHost}` : requestUrl.origin;

  const cookieStore = await cookies();

  // Accumulate cookies that Supabase wants to write so we can attach them to the
  // redirect response. Without this step they are lost — NextResponse.redirect()
  // creates a fresh response object that doesn't inherit cookies().set() calls.
  const pendingCookies: CookieEntry[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieEntry[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options ?? {} });
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Server Components can't mutate cookies — safe to swallow
            }
          });
        },
      },
    }
  );

  let sessionError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) sessionError = error.message;
  } else if (token_hash && type) {
    // "email" is the correct OTP type for both magic links and email OTPs
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "email",
    });
    if (error) sessionError = error.message;
  } else {
    sessionError = "Missing auth parameters";
  }

  if (sessionError) {
    const res = NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(sessionError)}`
    );
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
    );
    return res;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/`);
  }

  // Resolve destination before building the response
  let dest: string;

  const { data: existing } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (existing) {
    dest = existing.role === "student" ? "/student/dashboard" : "/restaurant/dashboard";
  } else {
    // First login — create profile; onboarding fills in name/location/etc.
    const { error: upsertError } = await supabase.from("profiles").upsert(
      { id: user.id, role: roleParam, email: user.email },
      { onConflict: "id" }
    );

    if (upsertError) {
      const res = NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent(
          "Profile creation failed: " + upsertError.message
        )}`
      );
      pendingCookies.forEach(({ name, value, options }) =>
        res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
      );
      return res;
    }

    dest = "/onboarding";
  }

  // Attach session cookies to the redirect so the browser is authenticated
  // on the very next request (the dashboard or onboarding page).
  const response = NextResponse.redirect(`${origin}${dest}`);
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(
      name,
      value,
      options as Parameters<typeof response.cookies.set>[2]
    )
  );

  return response;
}
