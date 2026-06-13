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
  const { count: unreadCount } = await service
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return (
    <StudentShell userName={profile.name} unreadCount={unreadCount ?? 0}>
      {children}
    </StudentShell>
  );
}
