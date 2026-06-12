"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75v-5.25h-7.5V21.75H3.75A.75.75 0 013 21V9.75z" />
      </svg>
    ),
  },
  {
    href: "/#messes",
    label: "Messes",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
      </svg>
    ),
  },
  {
    href: "/student/dashboard",
    label: "My Plan",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h4.5M3.75 3h16.5A.75.75 0 0121 3.75v16.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 20.25V3.75A.75.75 0 013.75 3z" />
      </svg>
    ),
  },
];

interface Props { userName?: string | null }

export default function BottomNav({ userName }: Props) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--color-border)] md:hidden pb-safe">
      <div className="flex items-stretch h-14">
        {ITEMS.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href.replace("/#messes", ""));
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

        {/* Profile / Sign out */}
        <form method="POST" action="/auth/logout" className="flex-1">
          <button
            type="submit"
            className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[var(--color-text-muted)]"
          >
            <span className="w-5 h-5 rounded-full bg-[var(--color-brand-primary)] text-white text-[10px] font-bold flex items-center justify-center uppercase">
              {userName ? userName.charAt(0) : "?"}
            </span>
            <span>Profile</span>
          </button>
        </form>
      </div>
    </nav>
  );
}
