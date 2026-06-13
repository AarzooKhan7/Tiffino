import RegisterForm from "@/components/RegisterForm";

export default function StudentRegisterPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#fff7f5 0%,#fff3e0 100%)" }}>
      <div className="flex-none px-6 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 mb-5">
          <span className="text-3xl font-extrabold text-[var(--color-brand-primary)]">Tiffino</span>
          <span className="text-2xl">🍱</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] leading-snug">
          Join Tiffino today
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
          Find your mess · subscribe · never skip a meal
        </p>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="bg-white rounded-t-3xl flex-1 px-6 pt-7 pb-10 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-5">Create student account</h2>
          <RegisterForm role="student" />
        </div>
      </div>
    </div>
  );
}
