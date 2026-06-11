// DEVELOPMENT ONLY — returns 404 in production
// Usage: GET /api/dev/test-auth?role=student  OR  ?role=restaurant
// Generates a real Supabase session without needing an email to be sent.
// Tests the exact same verifyOtp → cookie-setting → redirect path as production.
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const { searchParams, origin } = new URL(request.url);
  const role = (searchParams.get("role") ?? "student") as "student" | "restaurant";
  const email = `test-${role}@dev.local`;

  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.hashed_token) {
    return new Response(`generateLink failed: ${error?.message ?? "no token"}`, { status: 500 });
  }

  // Redirect to our own callback using token_hash — no PKCE verifier needed
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("token_hash", data.properties.hashed_token);
  callbackUrl.searchParams.set("type", "email");
  callbackUrl.searchParams.set("role", role);

  return NextResponse.redirect(callbackUrl.toString());
}
