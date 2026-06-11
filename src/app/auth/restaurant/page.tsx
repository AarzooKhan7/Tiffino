import AuthCard from "@/components/AuthCard";
import AuthTabs from "@/components/AuthTabs";

export default function RestaurantAuthPage() {
  return (
    <AuthCard title="Mess / Restaurant Sign In">
      <AuthTabs role="restaurant" />
    </AuthCard>
  );
}
