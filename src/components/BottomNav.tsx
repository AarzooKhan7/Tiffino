"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props { userName?: string | null }

export default function BottomNav({ userName }: Props) {
  const pathname = usePathname();

  const items = [
    {
      href: "/",
      label: "Home",
      exact: true,
      icon: HomeIcon,
    },
    {
      href: "/student/dashboard",
      label: "My Plan",
      exact: false,
      icon: PlanIcon,
    },
    {
      href: "/student/notifications",
      label: "Alerts",
      exact: false,
      icon: BellIcon,
    },
    {
      href: "/student/profile",
      label: "Profile",
      exact: false,
      icon: ({ active }: { active: boolean }) => (
        <span className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center uppercase transition-all ${
          active
            ? "bg-[var(--color-brand-primary)] scale-110 shadow-sm"
            : "bg-[var(--color-text-muted)]"
        }`}>
          {userName ? userName.charAt(0) : "?"}
        </span>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--color-border)] card-shadow-lg md:hidden">
      <div
        className="flex items-stretch pb-safe"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
      >
        {items.map(({ href, label, exact, icon: Icon }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-2 min-h-[56px] transition-colors relative ${
                active
                  ? "text-[var(--color-brand-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {/* Active indicator dot */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[var(--color-brand-primary)]" />
              )}
              <Icon active={active} />
              <span className={`text-[10px] font-semibold leading-none ${active ? "text-[var(--color-brand-primary)]" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform" style={{ transform: active ? "scale(1.1)" : "scale(1)" }} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75v-5.25h-7.5V21.75H3.75A.75.75 0 013 21V9.75z" />
    </svg>
  );
}

function PlanIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform" style={{ transform: active ? "scale(1.1)" : "scale(1)" }} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h4.5M3.75 3h16.5a.75.75 0 01.75.75v16.5a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75V3.75A.75.75 0 013.75 3z" />
    </svg>
  );
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform" style={{ transform: active ? "scale(1.1)" : "scale(1)" }} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}
