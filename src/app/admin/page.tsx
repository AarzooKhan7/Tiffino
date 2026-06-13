import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Only usernames listed in ADMIN_USERNAMES env var (comma-separated) can access this page.
// Default: deny all. Set ADMIN_USERNAMES=yourusername in .env.local to unlock.
function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_USERNAMES ?? "";
  if (!raw.trim()) return false;
  const allowed = raw.split(",").map((u) => `${u.trim()}@tiffino.local`);
  return allowed.includes(email.toLowerCase());
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email ?? "")) redirect("/");

  const service = createServiceClient();

  const [
    { data: allRestaurants },
    { data: allStudents },
    { data: allSubs },
    { data: allRedemptions },
  ] = await Promise.all([
    service.from("restaurants").select("id, name, area, owner_id, created_at").order("created_at", { ascending: false }),
    service.from("profiles").select("id, name, username, created_at").eq("role", "student").order("created_at", { ascending: false }),
    service.from("subscriptions").select("id, status, restaurant_id, student_id, price_paid, created_at").order("created_at", { ascending: false }),
    service.from("redemptions").select("id, status, meal_date").order("meal_date", { ascending: false }).limit(1000),
  ]);

  const activeSubs    = (allSubs ?? []).filter((s) => s.status === "active");
  const totalRevenue  = (allSubs ?? []).reduce((sum, s) => sum + Number(s.price_paid ?? 0), 0);
  const takenMeals    = (allRedemptions ?? []).filter((r) => r.status === "taken").length;
  const skippedMeals  = (allRedemptions ?? []).filter((r) => r.status === "skipped").length;

  // Per-restaurant sub counts
  const subsByRest: Record<string, number> = {};
  for (const s of allSubs ?? []) {
    const rid = s.restaurant_id as string;
    subsByRest[rid] = (subsByRest[rid] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      <header className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] card-shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-[var(--color-brand-primary)]">Tiffino</Link>
          <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-alt)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
            🔑 Admin view
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Platform overview</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Real-time snapshot · service role access</p>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Restaurants" value={allRestaurants?.length ?? 0} icon="🏠" />
          <KpiCard label="Students" value={allStudents?.length ?? 0} icon="👨‍🎓" />
          <KpiCard label="Active plans" value={activeSubs.length} icon="✅" accent />
          <KpiCard label="Total revenue" value={`₹${totalRevenue.toLocaleString()}`} icon="💰" accent />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <KpiCard label="Meals served" value={takenMeals} icon="🍱" />
          <KpiCard label="Meals skipped" value={skippedMeals} icon="⏭️" />
          <KpiCard label="All-time subs" value={allSubs?.length ?? 0} icon="📋" />
        </div>

        {/* Restaurants table */}
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-3">Restaurants ({allRestaurants?.length ?? 0})</h2>
          <div className="bg-white rounded-[var(--radius-card)] card-shadow overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Area</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Subs (all)</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Active</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {(allRestaurants ?? []).map((r) => {
                  const totalSubsForR  = subsByRest[r.id] ?? 0;
                  const activeSubsForR = activeSubs.filter((s) => s.restaurant_id === r.id).length;
                  return (
                    <tr key={r.id} className="hover:bg-[var(--color-surface-alt)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                        <Link href={`/restaurants/${r.id}`} className="hover:text-[var(--color-brand-primary)] hover:underline">
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{r.area ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{totalSubsForR}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${activeSubsForR > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {activeSubsForR} active
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                        {new Date(r.created_at as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students table */}
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-3">Students ({allStudents?.length ?? 0})</h2>
          <div className="bg-white rounded-[var(--radius-card)] card-shadow overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Username</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Active plan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {(allStudents ?? []).map((s) => {
                  const hasSub = activeSubs.some((sub) => sub.student_id === s.id);
                  return (
                    <tr key={s.id} className="hover:bg-[var(--color-surface-alt)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{s.name ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">@{s.username}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${hasSub ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {hasSub ? "Active" : "None"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                        {new Date(s.created_at as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({
  label, value, icon, accent = false,
}: {
  label: string; value: string | number; icon: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-[var(--radius-card)] card-shadow px-4 py-4 ${accent ? "bg-[var(--color-brand-primary)]" : "bg-white"}`}>
      <span className="text-xl">{icon}</span>
      <p className={`text-xl font-extrabold mt-1.5 leading-none ${accent ? "text-white" : "text-[var(--color-text-primary)]"}`}>
        {value}
      </p>
      <p className={`text-[11px] mt-1 ${accent ? "text-white/70" : "text-[var(--color-text-muted)]"}`}>{label}</p>
    </div>
  );
}
