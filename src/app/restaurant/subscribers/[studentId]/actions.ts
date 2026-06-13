"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function sendNudge(
  studentId: string,
  studentName: string,
  tokensRemaining: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const service = createServiceClient();

    // Verify the caller is a restaurant owner and this student is subscribed there
    const { data: restaurant } = await service
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!restaurant) return { ok: false, error: "Not authorized" };

    const { data: sub } = await service
      .from("subscriptions")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();
    if (!sub) return { ok: false, error: "Student has no active subscription at your restaurant" };

    const message = `Hi ${studentName}, your Tiffino token balance is running low — only ${tokensRemaining} token${tokensRemaining === 1 ? "" : "s"} left. Consider renewing your subscription soon!`;

    const { error } = await service.from("notifications").insert({
      user_id: studentId,
      type:    "nudge",
      message,
      read:    false,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function sendCustomNotification(
  studentId: string,
  body: string,
  restaurantName: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const service = createServiceClient();

    const { data: restaurant } = await service
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!restaurant) return { ok: false, error: "Not authorized" };

    const { data: sub } = await service
      .from("subscriptions")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();
    if (!sub) return { ok: false, error: "Student has no active subscription at your restaurant" };

    const message = `[${restaurantName}] ${body}`;
    const { error } = await service.from("notifications").insert({
      user_id: studentId,
      type:    "announcement",
      message,
      read:    false,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
