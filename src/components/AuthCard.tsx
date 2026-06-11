"use client";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--color-surface-alt)]">
      {/* Wordmark */}
      <a href="/" className="mb-8 text-3xl font-extrabold tracking-tight text-[var(--color-brand-primary)]">
        Tiffino
      </a>

      <div className="w-full max-w-md card-shadow rounded-[var(--radius-card)] bg-white px-8 py-8">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">{subtitle}</p>
        )}
        {children}
      </div>
    </main>
  );
}
