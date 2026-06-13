import LoginForm from "@/components/LoginForm";
import Link from "next/link";

export default function RestaurantLoginPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #f0f9ff 100%)" }}>

      <div className="flex-none px-6 pt-12 pb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <span className="w-10 h-10 rounded-2xl bg-[var(--color-brand-primary)] flex items-center justify-center text-base font-black text-white shadow-md">
            T
          </span>
          <span className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">tiffino</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          🍽 Restaurant portal
        </div>

        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] leading-snug">
          Mess owner login
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-[260px] mx-auto leading-relaxed">
          Manage your menu, subscribers, and QR check-ins
        </p>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white rounded-t-[28px] flex-1 px-6 pt-7 pb-10 shadow-[0_-6px_32px_rgba(0,0,0,0.10)]">
          <h2 className="text-lg font-extrabold text-[var(--color-text-primary)] mb-6">Sign in</h2>
          <LoginForm role="restaurant" />

          <p className="text-sm text-center text-[var(--color-text-muted)] mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/auth/restaurant/register" className="text-[var(--color-brand-primary)] font-bold hover:underline">
              Register your mess
            </Link>
          </p>
          <p className="text-xs text-center text-[var(--color-text-muted)] mt-3">
            Are you a student?{" "}
            <Link href="/auth/student" className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] font-semibold transition-colors">
              Student login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
