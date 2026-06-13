import Link from "next/link";

interface Props {
  userName?: string | null;
  role?: "student" | "restaurant" | null;
}

export default function AppHeader({ userName, role }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[var(--color-border)] card-shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="w-8 h-8 rounded-xl bg-[var(--color-brand-primary)] flex items-center justify-center text-sm font-black text-white shadow-sm group-hover:scale-105 transition-transform">
            T
          </span>
          <span className="text-lg font-black tracking-tight text-[var(--color-text-primary)]">
            tiffino
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {userName && role ? (
            <>
              <Link
                href={role === "student" ? "/student/dashboard" : "/restaurant/dashboard"}
                className="hidden sm:flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-1.5 px-3 rounded-full hover:bg-[var(--color-surface-alt)]"
              >
                <Avatar name={userName} size="sm" />
                <span className="max-w-[110px] truncate font-semibold">{userName}</span>
              </Link>
              <Link
                href={role === "student" ? "/student/dashboard" : "/restaurant/dashboard"}
                className="sm:hidden"
                aria-label="My account"
              >
                <Avatar name={userName} size="md" />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/student" className="btn-primary text-xs px-4 py-2">
                Sign in
              </Link>
              <Link href="/auth/restaurant" className="hidden sm:inline-flex btn-ghost text-xs px-4 py-2">
                List your mess
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Avatar({ name, size }: { name: string; size: "sm" | "md" }) {
  const s = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";
  return (
    <span className={`${s} rounded-full bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-deep)] text-white font-bold flex items-center justify-center uppercase shrink-0`}>
      {name.charAt(0)}
    </span>
  );
}
