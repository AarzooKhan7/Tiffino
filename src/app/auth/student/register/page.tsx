import AuthCard from "@/components/AuthCard";
import RegisterForm from "@/components/RegisterForm";

export default function StudentRegisterPage() {
  return (
    <AuthCard title="Create Student Account">
      <RegisterForm role="student" />
    </AuthCard>
  );
}
