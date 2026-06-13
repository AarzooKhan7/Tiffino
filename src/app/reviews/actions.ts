"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function submitReview(
  restaurantId: string,
  rating: number,
  comment: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "student") return { ok: false, error: "Only students can review" };

    // Must have had an active or past subscription at this restaurant
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("student_id", user.id)
      .eq("restaurant_id", restaurantId)
      .in("status", ["active", "expired"])
      .limit(1)
      .maybeSingle();
    if (!sub) return { ok: false, error: "You need an active or past subscription to review this mess" };

    const service = createServiceClient();
    const { error } = await service.from("reviews").upsert(
      { restaurant_id: restaurantId, student_id: user.id, rating, comment: comment.trim() || null },
      { onConflict: "restaurant_id,student_id" }
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
