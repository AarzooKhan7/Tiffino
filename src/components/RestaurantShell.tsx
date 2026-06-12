"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
const NAV = [
  { href: "/restaurant/dashboard", label: "Dashboard" },
  { href: "/restaurant/dishes",    label: "Dishes" },
  { href: "/restaurant/menu",      label: "Menu" },
  { href: "/restaurant/setup",     label: "Settings" },
];

interface Props {
  fullName: string | null;
  children: React.ReactNode;
}

export default function RestaurantShell({ fullName, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-40 card-shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            href="/restaurant/dashboard"
            className="text-xl font-extrabold text-[var(--color-brand-primary)] shrink-0"
          >
            Tiffino
          </Link>

          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap px-3 py-1.5 rounded-[var(--radius-btn)] text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-[var(--color-brand-primary)] text-white"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:block text-sm text-[var(--color-text-secondary)] truncate max-w-[120px]">
              {fullName ?? "Restaurant"}
            </span>
            <form method="POST" action="/auth/logout">
              <button type="submit" className="btn-ghost text-xs px-3 py-1.5">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
