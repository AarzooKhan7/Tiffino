"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, lazy, Suspense } from "react";
import { claimMeal } from "@/app/redemptions/actions";

const QRScanner = lazy(() => import("./QRScanner"));

interface Props {
  userName?: string | null;
  subscriptionId?: string | null;
  slots?: string[];
  restaurantName?: string | null;
}

export default function BottomNav({ userName, subscriptionId, slots = [], restaurantName = "" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [scanning, setScanning] = useState<"lunch" | "dinner" | false>(false);
  const [slotPicker, setSlotPicker] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function handleScanPress() {
    if (!subscriptionId) {
      router.push("/student/dashboard");
      return;
    }
    const hasLunch  = slots.includes("lunch");
    const hasDinner = slots.includes("dinner");
    if (hasLunch && hasDinner) {
      setSlotPicker(true);
    } else if (hasLunch) {
      setScanning("lunch");
    } else if (hasDinner) {
      setScanning("dinner");
    } else {
      router.push("/student/dashboard");
    }
  }

  function handleSlotPick(slot: "lunch" | "dinner") {
    setSlotPicker(false);
    setScanning(slot);
  }

  async function handleScan(token: string) {
    if (!subscriptionId || !scanning) return;
    const slot = scanning;
    startTransition(async () => {
      const res = await claimMeal(subscriptionId, slot, token);
      setScanning(false);
      if (res.ok) {
        const now = new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
        });
        const params = new URLSearchParams({
          slot,
          restaurant: restaurantName ?? "",
          tokens: String(res.tokensRemaining ?? ""),
          time: now,
        });
        router.push(`/student/scan-success?${params.toString()}`);
      } else {
        showToast(false, res.error ?? "Scan failed");
      }
    });
  }

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const navItems: { href: string; label: string; exact: boolean; icon: (a: boolean) => React.ReactNode }[] = [
    {
      href: "/", label: "Home", exact: true,
      icon: (a) => <HomeIcon active={a} />,
    },
    {
      href: "/student/dashboard", label: "My Plan", exact: false,
      icon: (a) => <PlanIcon active={a} />,
    },
    {
      href: "/student/notifications", label: "Alerts", exact: false,
      icon: (a) => <BellIcon active={a} />,
    },
    {
      href: "/student/profile", label: "Profile", exact: false,
      icon: (a) => (
        <span className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center uppercase transition-all ${
          a ? "bg-[var(--color-brand-primary)] scale-110 shadow-sm" : "bg-[var(--color-text-muted)]"
        }`}>
          {userName ? userName.charAt(0) : "?"}
        </span>
      ),
    },
  ];

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-xl shadow-xl text-sm font-semibold whitespace-nowrap ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.ok ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Slot picker bottom sheet */}
      {slotPicker && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSlotPicker(false)}>
          <div className="w-full bg-white rounded-t-3xl shadow-2xl px-6 pt-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-5" />
            <p className="text-sm font-bold text-center text-[var(--color-text-primary)] mb-4">Which meal are you scanning for?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleSlotPick("lunch")}
                className="flex-1 btn-primary py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
              >
                🌞 Lunch
              </button>
              <button
                onClick={() => handleSlotPick("dinner")}
                className="flex-1 btn-primary py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
              >
                🌙 Dinner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner modal */}
      {scanning && (
        <Suspense fallback={null}>
          <QRScanner
            onScan={(token) => void handleScan(token)}
            onClose={() => setScanning(false)}
          />
        </Suspense>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--color-border)] card-shadow-lg md:hidden">
        <div
          className="flex items-end"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
        >
          {/* Home */}
          <NavItem href="/" label="Home" exact icon={navItems[0].icon} pathname={pathname} />

          {/* My Plan */}
          <NavItem href="/student/dashboard" label="My Plan" exact={false} icon={navItems[1].icon} pathname={pathname} />

          {/* Center Scan button */}
          <div className="flex-1 flex flex-col items-center pb-1">
            <button
              onClick={handleScanPress}
              disabled={isPending}
              className="w-[52px] h-[52px] rounded-full text-white shadow-lg flex items-center justify-center -translate-y-4 border-[3px] border-white active:scale-95 transition-transform disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-deep))" }}
              aria-label="Scan QR code"
            >
              {isPending ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <ScanIcon />
              )}
            </button>
            <span className="text-[9px] font-bold leading-none -mt-3 text-[var(--color-brand-primary)]">Scan</span>
          </div>

          {/* Alerts */}
          <NavItem href="/student/notifications" label="Alerts" exact={false} icon={navItems[2].icon} pathname={pathname} />

          {/* Profile */}
          <NavItem href="/student/profile" label="Profile" exact={false} icon={navItems[3].icon} pathname={pathname} />
        </div>
      </nav>
    </>
  );
}

function NavItem({
  href, label, exact, icon, pathname,
}: {
  href: string; label: string; exact: boolean;
  icon: (a: boolean) => React.ReactNode; pathname: string;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-2 min-h-[56px] transition-colors relative ${
        active ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
      }`}
    >
      {active && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[var(--color-brand-primary)]" />
      )}
      {icon(active)}
      <span className={`text-[10px] font-semibold leading-none ${active ? "text-[var(--color-brand-primary)]" : ""}`}>
        {label}
      </span>
    </Link>
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

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <rect x="7" y="7" width="3" height="3" />
      <rect x="14" y="7" width="3" height="3" />
      <rect x="7" y="14" width="3" height="3" />
      <path d="M14 14h3v3" />
    </svg>
  );
}
