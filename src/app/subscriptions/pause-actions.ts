"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { nowIST } from "@/lib/ist";

export async function pauseSubscription(
  subscriptionId: string,
  days: number,
): Promise<{ ok: boolean; error?: string; pauseEndsAt?: string }> {
  try {
    if (days < 1 || days > 14) return { ok: false, error: "Pause duration must be 1–14 days" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const service = createServiceClient();

    const { data: sub } = await service
      .from("subscriptions")
      .select("id, student_id, status, paused_at, pause_ends_at")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (!sub || (sub.student_id as string) !== user.id) return { ok: false, error: "Subscription not found" };
    if (sub.status !== "active") return { ok: false, error: "Only active subscriptions can be paused" };
    if (sub.paused_at) return { ok: false, error: "Subscription is already paused" };

    const now = nowIST();
    const pauseEndsAt = new Date(now.getTime() + days * 86400000);

    const { error } = await service
      .from("subscriptions")
      .update({ paused_at: now.toISOString(), pause_ends_at: pauseEndsAt.toISOString() })
      .eq("id", subscriptionId);

    if (error) return { ok: false, error: error.message };
    return { ok: true, pauseEndsAt: pauseEndsAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function resumeSubscription(
  subscriptionId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const service = createServiceClient();

    const { data: sub } = await service
      .from("subscriptions")
      .select("id, student_id, paused_at")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (!sub || (sub.student_id as string) !== user.id) return { ok: false, error: "Subscription not found" };
    if (!sub.paused_at) return { ok: false, error: "Subscription is not paused" };

    const { error } = await service
      .from("subscriptions")
      .update({ paused_at: null, pause_ends_at: null })
      .eq("id", subscriptionId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
