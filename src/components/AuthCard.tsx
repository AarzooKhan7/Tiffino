"use client";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--color-surface-alt)]">
      <a href="/" className="mb-6 flex flex-col items-center gap-1">
        <span className="text-4xl font-extrabold tracking-tight text-[var(--color-brand-primary)]">Tiffino</span>
        <span className="text-xs text-[var(--color-text-muted)] font-medium">daily mess, sorted</span>
      </a>
      <div className="w-full max-w-md bg-white rounded-[var(--radius-card)] card-shadow-lg px-8 py-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--color-text-secondary)] mb-5">{subtitle}</p>}
        {!subtitle && <div className="mb-5" />}
        {children}
      </div>
      <p className="mt-6 text-xs text-[var(--color-text-muted)]">
        <a href="/" className="hover:underline">← Back to home</a>
      </p>
    </main>
  );
}
