"use client";

export default function LogoutButton() {
  return (
    <form method="POST" action="/auth/logout">
      <button
        type="submit"
        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
