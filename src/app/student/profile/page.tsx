export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { updateStudentProfile } from "./actions";
import Link from "next/link";

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] bg-white";

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/student");

  const service = createServiceClient();
  const [{ data: profile }, { data: activeSub }, { data: subHistory }] = await Promise.all([
    service
      .from("profiles")
      .select("name, username, location, diet_pref, role")
      .eq("id", user.id)
      .single(),
    service
      .from("subscriptions")
      .select("id, slots, tokens_remaining, tokens_total, end_date, restaurant:restaurant_id(name, area)")
      .eq("student_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    service
      .from("subscriptions")
      .select("id, slots, status, start_date, end_date, price_paid, restaurant:restaurant_id(name)")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!profile || profile.role !== "student") redirect("/");

  const restaurant = activeSub
    ? (Array.isArray(activeSub.restaurant) ? activeSub.restaurant[0] : activeSub.restaurant) as { name: string; area: string } | null
    : null;

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Profile, plan and account details.</p>
      </div>

      {/* ── Avatar + identity ── */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)] text-white text-2xl font-extrabold flex items-center justify-center uppercase shrink-0">
            {profile.name ? profile.name.charAt(0) : "S"}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-[var(--color-text-primary)] truncate">{profile.name}</p>
            <p className="text-sm text-[var(--color-text-muted)]">@{profile.username}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.location && (
                <span className="text-xs border border-[var(--color-border)] rounded-full px-2 py-0.5 text-[var(--color-text-secondary)]">
                  📍 {profile.location}
                </span>
              )}
              {profile.diet_pref && (
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                  profile.diet_pref === "veg"    ? "bg-green-50 text-green-700 border border-green-200" :
                  profile.diet_pref === "nonveg" ? "bg-red-50 text-red-700 border border-red-200" :
                                                   "bg-orange-50 text-orange-700 border border-orange-200"
                }`}>
                  {profile.diet_pref === "veg" ? "🥦 Veg" : profile.diet_pref === "nonveg" ? "🍗 Non-veg" : "🍱 Mix"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Active plan ── */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
        <div className="px-5 pt-4 pb-1">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Current plan</p>
        </div>
        {activeSub && restaurant ? (
          <div className="px-5 pb-4 pt-2">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">{restaurant.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {(activeSub.slots as string[]).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ")}
                  {" · "} expires {activeSub.end_date as string}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-extrabold text-[var(--color-brand-primary)]">{activeSub.tokens_remaining}</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">tokens left</p>
              </div>
            </div>
            <Link
              href="/student/dashboard"
              className="mt-3 flex items-center justify-between py-2.5 border-t border-[var(--color-border)] text-xs font-semibold text-[var(--color-brand-secondary)]"
            >
              View dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="px-5 pb-4 pt-2 flex items-center justify-between">
            <p className="text-sm text-[var(--color-text-muted)]">No active subscription</p>
            <Link href="/" className="text-xs font-semibold text-[var(--color-brand-secondary)]">
              Browse messes →
            </Link>
          </div>
        )}
      </div>

      {/* ── Edit profile ── */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
        <div className="px-5 pt-4 pb-1">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Edit profile</p>
        </div>
        <form action={updateStudentProfile} className="px-5 pb-5 pt-3 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Full name *</label>
            <input name="name" required defaultValue={profile.name ?? ""} placeholder="Your name" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Location</label>
            <input name="location" defaultValue={profile.location ?? ""} placeholder="e.g. Kothrud, Pune" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Diet preference</label>
            <div className="flex flex-wrap gap-4">
              {(["veg", "nonveg", "mix"] as const).map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                  <input
                    type="radio"
                    name="diet_pref"
                    value={d}
                    defaultChecked={profile.diet_pref === d}
                    className="accent-[var(--color-brand-primary)] w-4 h-4"
                  />
                  {d === "veg" ? "🥦 Veg" : d === "nonveg" ? "🍗 Non-veg" : "🍱 Mix"}
                </label>
              ))}
              <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="diet_pref"
                  value=""
                  defaultChecked={!profile.diet_pref}
                  className="accent-[var(--color-brand-primary)] w-4 h-4"
                />
                None
              </label>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 text-sm">
            Save changes
          </button>
        </form>
      </div>

      {/* ── Account info ── */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
        <div className="px-5 pt-4 pb-1">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Account</p>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          <Row label="Username" value={`@${profile.username}`} />
          <Row label="Role" value="Student" />
        </div>
      </div>

      {/* ── Subscription history ── */}
      {subHistory && subHistory.length > 0 && (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Subscription history</p>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {subHistory.map((sub) => {
              const restName =
                (Array.isArray(sub.restaurant) ? sub.restaurant[0] : sub.restaurant)?.name ?? "—";
              return (
                <div key={sub.id} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{restName}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {sub.start_date as string} → {sub.end_date as string}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {(sub.slots as string[]).join(" + ")} · ₹{Number(sub.price_paid).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[11px] rounded-full px-2.5 py-0.5 font-semibold shrink-0 mt-0.5 ${
                    sub.status === "active"  ? "bg-green-100 text-green-700" :
                    sub.status === "expired" ? "bg-gray-100 text-gray-500"  :
                                               "bg-red-100 text-red-600"
                  }`}>
                    {sub.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sign out ── */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
        <form method="POST" action="/auth/logout">
          <button
            type="submit"
            className="w-full text-sm font-semibold text-red-500 py-4 hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-3">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}
