import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentOnboardingForm from "@/components/StudentOnboardingForm";
import RestaurantOnboardingForm from "@/components/RestaurantOnboardingForm";
import AuthCard from "@/components/AuthCard";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, location")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/");

  // If profile is already filled, skip onboarding
  const isDone =
    profile.role === "student"
      ? !!(profile.name && profile.location)
      : !!profile.name;

  if (isDone) {
    redirect(profile.role === "student" ? "/student/dashboard" : "/restaurant/dashboard");
  }

  return (
    <AuthCard
      title={profile.role === "student" ? "Tell us about yourself" : "Set up your mess"}
      subtitle="Just a few details to personalise your experience."
    >
      {profile.role === "student" ? (
        <StudentOnboardingForm />
      ) : (
        <RestaurantOnboardingForm />
      )}
    </AuthCard>
  );
}
