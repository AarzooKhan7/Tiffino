import AuthCard from "@/components/AuthCard";
import LoginForm from "@/components/LoginForm";

export default function RestaurantLoginPage() {
  return (
    <AuthCard title="Mess / Restaurant Sign In">
      <LoginForm role="restaurant" />
    </AuthCard>
  );
}
