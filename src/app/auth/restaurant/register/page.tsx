import AuthCard from "@/components/AuthCard";
import RegisterForm from "@/components/RegisterForm";

export default function RestaurantRegisterPage() {
  return (
    <AuthCard title="Create Restaurant Account">
      <RegisterForm role="restaurant" />
    </AuthCard>
  );
}
