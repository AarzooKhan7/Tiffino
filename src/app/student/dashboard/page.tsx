import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function StudentDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/student");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, location, diet_pref, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") redirect("/auth/student");

  return (
    <main className="min-h-screen bg-[var(--color-surface-alt)] p-6">
      {/* Top bar */}
      <header className="max-w-2xl mx-auto flex items-center justify-between mb-8">
        <span className="text-2xl font-extrabold text-[var(--color-brand-primary)]">Tiffino</span>
        <LogoutButton />
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Greeting card */}
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">Welcome back,</p>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {profile.name ?? user.email}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--color-brand-primary)] text-white text-xs font-semibold px-3 py-1">
              Student
            </span>
            {profile.location && (
              <span className="rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs px-3 py-1 border border-[var(--color-border)]">
                📍 {profile.location}
              </span>
            )}
            {profile.diet_pref && (
              <span className="rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs px-3 py-1 border border-[var(--color-border)]">
                🥗 {profile.diet_pref}
              </span>
            )}
          </div>
        </div>

        {/* Placeholder sections */}
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-2">My Subscription</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Phase 3 — coming soon.</p>
        </div>

        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-2">This Week&apos;s Menu</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Phase 3 — coming soon.</p>
        </div>
      </div>
    </main>
  );
}
