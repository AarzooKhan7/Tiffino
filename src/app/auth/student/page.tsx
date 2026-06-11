import AuthCard from "@/components/AuthCard";
import AuthTabs from "@/components/AuthTabs";

export default function StudentAuthPage() {
  return (
    <AuthCard title="Student Sign In">
      <AuthTabs role="student" />
    </AuthCard>
  );
}
