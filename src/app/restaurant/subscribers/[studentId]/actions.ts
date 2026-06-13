"use server";

import { createServiceClient } from "@/lib/supabase/server";

export async function sendNudge(
  studentId: string,
  studentName: string,
  tokensRemaining: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const service = createServiceClient();

    const message = `Hi ${studentName}, your Tiffino token balance is running low (${tokensRemaining} tokens left). Consider renewing your subscription soon!`;

    const { error } = await service.from("notifications").insert({
      user_id: studentId,
      type: "nudge",
      message,
      read: false,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
