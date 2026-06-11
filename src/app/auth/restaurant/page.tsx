import AuthCard from "@/components/AuthCard";
import AuthPasswordForm from "@/components/AuthPasswordForm";

export default function RestaurantAuthPage() {
  return (
    <AuthCard title="Mess / Restaurant Sign In">
      <AuthPasswordForm role="restaurant" />
    </AuthCard>
  );
}
