import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  return <StudentShell userName={profile.name}>{children}</StudentShell>;
}
