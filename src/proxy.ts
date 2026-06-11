import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          );
        },
      },
    }
  );

  // Refresh the session — MUST be called before any getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Public routes — always allowed ──────────────────────────────────────────
  const publicPaths = ["/", "/auth/student", "/auth/restaurant", "/auth/callback"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "?"))) {
    return response;
  }

  // Dev-only bypass routes — blocked at 404 in production by the handler itself
  if (process.env.NODE_ENV === "development" && pathname.startsWith("/api/dev")) {
    return response;
  }

  // Public restaurant pages
  if (pathname.startsWith("/restaurants")) {
    return response;
  }

  // ── Not logged in → redirect to landing ─────────────────────────────────────
  if (!user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── Fetch role from profiles ─────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as "student" | "restaurant" | undefined;

  // No profile yet → onboarding (avoid redirect loop)
  if (!role) {
    if (!pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return response;
  }

  // ── Onboarding already done → skip it ────────────────────────────────────────
  if (pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(
      new URL(role === "student" ? "/student/dashboard" : "/restaurant/dashboard", request.url)
    );
  }

  // ── Cross-role access guard ──────────────────────────────────────────────────
  if (pathname.startsWith("/student") && role !== "student") {
    return NextResponse.redirect(new URL("/restaurant/dashboard", request.url));
  }
  if (pathname.startsWith("/restaurant") && role !== "restaurant") {
    return NextResponse.redirect(new URL("/student/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
