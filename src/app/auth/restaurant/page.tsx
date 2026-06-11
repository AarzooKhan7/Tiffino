import AuthEmailForm from "@/components/AuthEmailForm";
import AuthCard from "@/components/AuthCard";

export default function RestaurantAuthPage() {
  return (
    <AuthCard
      title="Mess / Restaurant Sign In"
      subtitle="We'll send a magic link to your email — no password needed."
    >
      <AuthEmailForm role="restaurant" />
    </AuthCard>
  );
}
