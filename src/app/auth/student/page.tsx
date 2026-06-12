import AuthCard from "@/components/AuthCard";
import LoginForm from "@/components/LoginForm";

export default function StudentLoginPage() {
  return (
    <AuthCard title="Student Sign In">
      <LoginForm role="student" />
    </AuthCard>
  );
}
