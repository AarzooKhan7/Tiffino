import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function RestaurantDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, restaurant_name, area, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "restaurant") redirect("/auth/restaurant");

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
            {profile.full_name ?? user.email}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] text-white text-xs font-semibold px-3 py-1">
              Restaurant
            </span>
            {profile.restaurant_name && (
              <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs px-3 py-1 border border-[var(--color-border)]">
                🍽 {profile.restaurant_name}
              </span>
            )}
            {profile.area && (
              <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs px-3 py-1 border border-[var(--color-border)]">
                📍 {profile.area}
              </span>
            )}
          </div>
        </div>

        {/* Placeholder sections */}
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-2">Weekly Menu</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Phase 2 — coming soon.</p>
        </div>

        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-2">Active Subscriptions</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Phase 2 — coming soon.</p>
        </div>

        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-2">QR Code</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Phase 2 — coming soon.</p>
        </div>
      </div>
    </main>
  );
}
