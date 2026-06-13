import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import StudentShell from "@/components/StudentShell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/student");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") redirect("/");

  const service = createServiceClient();

  const [{ count: unreadCount }, { data: activeSub }] = await Promise.all([
    service
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
    service
      .from("subscriptions")
      .select("id, slots, restaurant:restaurant_id(name)")
      .eq("student_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const restaurantRaw = activeSub?.restaurant;
  const restaurantName =
    restaurantRaw && !Array.isArray(restaurantRaw) && typeof restaurantRaw === "object"
      ? (restaurantRaw as { name?: string }).name ?? null
      : Array.isArray(restaurantRaw) && restaurantRaw[0]
      ? (restaurantRaw[0] as { name?: string }).name ?? null
      : null;

  return (
    <StudentShell
      userName={profile.name}
      unreadCount={unreadCount ?? 0}
      subscriptionId={activeSub?.id ?? null}
      slots={(activeSub?.slots as string[] | null) ?? []}
      restaurantName={restaurantName}
    >
      {children}
    </StudentShell>
  );
}
