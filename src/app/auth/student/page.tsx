import LoginForm from "@/components/LoginForm";
import Link from "next/link";

export default function StudentLoginPage() {
  return (
    <AuthShell
      badge="Student login"
      headline="Welcome back"
      sub="Sign in to track your meals and manage your plan"
      formTitle="Sign in"
      formNode={<LoginForm role="student" />}
      switchText="Don't have an account?"
      switchHref="/auth/student/register"
      switchLabel="Create account"
      altText="Are you a mess owner?"
      altHref="/auth/restaurant"
      altLabel="Owner login →"
    />
  );
}

function AuthShell({
  badge, headline, sub, formTitle, formNode,
  switchText, switchHref, switchLabel,
  altText, altHref, altLabel,
}: {
  badge: string; headline: string; sub: string;
  formTitle: string; formNode: React.ReactNode;
  switchText: string; switchHref: string; switchLabel: string;
  altText?: string; altHref?: string; altLabel?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #fff8f5 0%, #fff3e0 50%, #fce4d6 100%)" }}>

      {/* Top: branding */}
      <div className="flex-none px-6 pt-12 pb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <span className="w-10 h-10 rounded-2xl bg-[var(--color-brand-primary)] flex items-center justify-center text-base font-black text-white shadow-md">
            T
          </span>
          <span className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">tiffino</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          {badge}
        </div>

        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] leading-snug">
          {headline}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-[260px] mx-auto leading-relaxed">
          {sub}
        </p>
      </div>

      {/* Bottom: form card */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white rounded-t-[28px] flex-1 px-6 pt-7 pb-10 shadow-[0_-6px_32px_rgba(0,0,0,0.10)]">
          <h2 className="text-lg font-extrabold text-[var(--color-text-primary)] mb-6">{formTitle}</h2>
          {formNode}

          {/* Switch */}
          <p className="text-sm text-center text-[var(--color-text-muted)] mt-5">
            {switchText}{" "}
            <Link href={switchHref} className="text-[var(--color-brand-primary)] font-bold hover:underline">
              {switchLabel}
            </Link>
          </p>

          {/* Alt link */}
          {altText && altHref && altLabel && (
            <p className="text-xs text-center text-[var(--color-text-muted)] mt-3">
              {altText}{" "}
              <Link href={altHref} className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] font-semibold transition-colors">
                {altLabel}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
