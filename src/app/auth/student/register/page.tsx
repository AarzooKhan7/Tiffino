import RegisterForm from "@/components/RegisterForm";
import Link from "next/link";

export default function StudentRegisterPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #fff8f5 0%, #fff3e0 50%, #fce4d6 100%)" }}>

      <div className="flex-none px-6 pt-12 pb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <span className="w-10 h-10 rounded-2xl bg-[var(--color-brand-primary)] flex items-center justify-center text-base font-black text-white shadow-md">
            T
          </span>
          <span className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">tiffino</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          New student
        </div>

        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] leading-snug">
          Join Tiffino today
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-[260px] mx-auto leading-relaxed">
          Find your mess · subscribe · never skip a meal
        </p>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white rounded-t-[28px] flex-1 px-6 pt-7 pb-10 shadow-[0_-6px_32px_rgba(0,0,0,0.10)]">
          <h2 className="text-lg font-extrabold text-[var(--color-text-primary)] mb-6">Create account</h2>
          <RegisterForm role="student" />

          <p className="text-sm text-center text-[var(--color-text-muted)] mt-5">
            Already have an account?{" "}
            <Link href="/auth/student" className="text-[var(--color-brand-primary)] font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
