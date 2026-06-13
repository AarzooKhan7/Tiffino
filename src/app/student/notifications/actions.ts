"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAllRead(userId: string): Promise<void> {
  const service = createServiceClient();
  await service
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  revalidatePath("/student/notifications");
}
