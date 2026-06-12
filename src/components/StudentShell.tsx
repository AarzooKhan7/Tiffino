"use client";

import Link from "next/link";
import BottomNav from "./BottomNav";

interface Props {
  userName: string | null;
  children: React.ReactNode;
}

export default function StudentShell({ userName, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] card-shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-[var(--color-brand-primary)]">
            Tiffino
          </Link>
          <div className="flex items-center gap-3">
            {/* Desktop sign-out */}
            <form method="POST" action="/auth/logout" className="hidden md:block">
              <button type="submit" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors font-medium">
                Sign out
              </button>
            </form>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[var(--color-brand-primary)] text-white text-sm font-bold flex items-center justify-center uppercase">
              {userName ? userName.charAt(0) : "S"}
            </div>
          </div>
        </div>
      </header>

      {/* Content — extra bottom padding for the fixed nav on mobile */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-20 md:pb-8">
        {children}
      </main>

      <BottomNav userName={userName} />
    </div>
  );
}
