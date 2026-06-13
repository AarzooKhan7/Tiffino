"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/restaurant/dashboard",
    label: "Home",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75v-5.25h-7.5V21.75H3.75A.75.75 0 013 21V9.75z" />
      </svg>
    ),
  },
  {
    href: "/restaurant/dishes",
    label: "Dishes",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    href: "/restaurant/menu",
    label: "Menu",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h4.5M3.75 3h16.5A.75.75 0 0121 3.75v16.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 20.25V3.75A.75.75 0 013.75 3z" />
      </svg>
    ),
  },
  {
    href: "/restaurant/subscribers",
    label: "Members",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    href: "/restaurant/setup",
    label: "Settings",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface Props {
  fullName: string | null;
  children: React.ReactNode;
}

export default function RestaurantShell({ fullName, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      {/* Top header — logo + name + desktop nav */}
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-40 card-shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/restaurant/dashboard" className="text-xl font-extrabold text-[var(--color-brand-primary)] shrink-0">
            Tiffino
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-[var(--radius-btn)] text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
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

      {/* Page content — extra bottom padding for mobile bottom nav */}
      <div className="max-w-5xl mx-auto px-4 py-5 pb-24 md:pb-8">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--color-border)] md:hidden pb-safe">
        <div className="flex items-stretch h-14">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  active ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                {icon(active)}
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
