"use client";

import Link from "next/link";
import BottomNav from "./BottomNav";

interface Props {
  userName: string | null;
  unreadCount?: number;
  subscriptionId?: string | null;
  slots?: string[];
  restaurantName?: string | null;
  children: React.ReactNode;
}

export default function StudentShell({ userName, unreadCount = 0, subscriptionId, slots, restaurantName, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">

      {/* ── Sticky header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[var(--color-border)] card-shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-[9px] bg-[var(--color-brand-primary)] flex items-center justify-center text-xs font-black text-white group-hover:scale-105 transition-transform shadow-sm">
              T
            </span>
            <span className="text-base font-black tracking-tight text-[var(--color-text-primary)]">tiffino</span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">

            {/* Notification bell */}
            <Link
              href="/student/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-alt)] transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--color-brand-primary)] text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-deep)] text-white text-sm font-bold flex items-center justify-center uppercase shadow-sm">
              {userName ? userName.charAt(0) : "S"}
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-24 md:pb-10">
        {children}
      </main>

      {/* ── Bottom nav (mobile only) ─────────────────────────────────── */}
      <BottomNav
        userName={userName}
        subscriptionId={subscriptionId}
        slots={slots}
        restaurantName={restaurantName}
      />
    </div>
  );
}
