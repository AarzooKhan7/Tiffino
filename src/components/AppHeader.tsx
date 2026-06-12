import Link from "next/link";

interface Props {
  /** Pass the signed-in user's name to show avatar; omit for guest header */
  userName?: string | null;
  /** Role determines which "my plan" link to show */
  role?: "student" | "restaurant" | null;
}

export default function AppHeader({ userName, role }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] card-shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <span className="text-xl font-extrabold tracking-tight text-[var(--color-brand-primary)]">
            Tiffino
          </span>
          <span className="hidden sm:block text-xs font-medium text-[var(--color-text-muted)] mt-0.5">
            daily mess, sorted
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {userName && role ? (
            <>
              <Link
                href={role === "student" ? "/student/dashboard" : "/restaurant/dashboard"}
                className="hidden sm:flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-[var(--color-brand-primary)] text-white text-xs font-bold flex items-center justify-center uppercase">
                  {userName.charAt(0)}
                </span>
                <span className="max-w-[100px] truncate font-medium">{userName}</span>
              </Link>
              {/* Mobile: just avatar */}
              <Link
                href={role === "student" ? "/student/dashboard" : "/restaurant/dashboard"}
                className="sm:hidden w-8 h-8 rounded-full bg-[var(--color-brand-primary)] text-white text-sm font-bold flex items-center justify-center uppercase"
              >
                {userName.charAt(0)}
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/student" className="btn-primary text-xs px-3 py-2 hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/auth/restaurant" className="btn-ghost text-xs px-3 py-2 hidden sm:inline-flex">
                Mess owner
              </Link>
              {/* Mobile: single sign in */}
              <Link href="/auth/student" className="btn-primary text-xs px-3 py-2 sm:hidden">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
