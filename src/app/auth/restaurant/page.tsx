import LoginForm from "@/components/LoginForm";

export default function RestaurantLoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-alt)]">
      <div className="flex-none px-6 pt-10 pb-6 text-center">
        <a href="/auth/student" className="text-3xl font-extrabold text-[var(--color-brand-primary)]">Tiffino</a>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mt-4">Mess / Restaurant portal</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage your menu, subscribers, and QR check-ins</p>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="bg-white rounded-t-3xl flex-1 px-6 pt-7 pb-10 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-5">Sign in as Restaurant</h2>
          <LoginForm role="restaurant" />
        </div>
      </div>
    </div>
  );
}
