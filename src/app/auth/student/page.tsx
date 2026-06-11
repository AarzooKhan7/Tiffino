import AuthCard from "@/components/AuthCard";
import AuthPasswordForm from "@/components/AuthPasswordForm";

export default function StudentAuthPage() {
  return (
    <AuthCard title="Student Sign In">
      <AuthPasswordForm role="student" />
    </AuthCard>
  );
}
