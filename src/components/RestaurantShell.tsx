"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/restaurant/dashboard",
    label: "Home",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform" style={{ transform: a ? "scale(1.1)" : "scale(1)" }} fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75v-5.25h-7.5V21.75H3.75A.75.75 0 013 21V9.75z" />
      </svg>
    ),
  },
  {
    href: "/restaurant/kitchen",
    label: "Kitchen",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform" style={{ transform: a ? "scale(1.1)" : "scale(1)" }} fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    href: "/restaurant/dishes",
    label: "Dishes",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform" style={{ transform: a ? "scale(1.1)" : "scale(1)" }} fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    href: "/restaurant/menu",
    label: "Menu",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform" style={{ transform: a ? "scale(1.1)" : "scale(1)" }} fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h4.5M3.75 3h16.5A.75.75 0 0121 3.75v16.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 20.25V3.75A.75.75 0 013.75 3z" />
      </svg>
    ),
  },
  {
    href: "/restaurant/subscribers",
    label: "Subscribers",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform" style={{ transform: a ? "scale(1.1)" : "scale(1)" }} fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    href: "/restaurant/setup",
    label: "Settings",
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform" style={{ transform: a ? "scale(1.1)" : "scale(1)" }} fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
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

  function isActive(href: string) {
    return href === "/restaurant/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[var(--color-border)] sticky top-0 z-40 card-shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/restaurant/dashboard" className="flex items-center gap-2 group shrink-0">
            <span className="w-7 h-7 rounded-[9px] bg-[var(--color-brand-primary)] flex items-center justify-center text-xs font-black text-white group-hover:scale-105 transition-transform shadow-sm">
              T
            </span>
            <span className="text-base font-black tracking-tight text-[var(--color-text-primary)]">tiffino</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1 flex-1 justify-center">
            {NAV.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? "bg-[var(--color-brand-primary)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: name + sign out */}
          <div className="flex items-center gap-3 shrink-0">
            {fullName && (
              <span className="hidden sm:block text-xs font-semibold text-[var(--color-text-secondary)] truncate max-w-[120px]">
                {fullName}
              </span>
            )}
            <form method="POST" action="/auth/logout">
              <button type="submit" className="btn-ghost text-xs px-3 py-1.5">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-5 pb-24 md:pb-10">
        {children}
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--color-border)] card-shadow-lg md:hidden">
        <div
          className="flex items-stretch"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
        >
          {NAV.map(({ href, label, icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-2 min-h-[56px] relative transition-colors ${
                  active ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[var(--color-brand-primary)]" />
                )}
                {icon(active)}
                <span className="text-[9px] font-semibold leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
