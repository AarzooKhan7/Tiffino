import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RestaurantShell from "@/components/RestaurantShell";

export default async function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "restaurant") redirect("/");

  return <RestaurantShell fullName={profile.name}>{children}</RestaurantShell>;
}
