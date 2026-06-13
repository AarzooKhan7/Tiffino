export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { updateStudentProfile } from "./actions";
import Link from "next/link";

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]";

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
      .select("id, slots, tokens_remaining, tokens_total, status, start_date, end_date, price_paid, restaurant:restaurant_id(name)")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!profile || profile.role !== "student") redirect("/");

  const restaurant = activeSub
    ? (Array.isArray(activeSub.restaurant) ? activeSub.restaurant[0] : activeSub.restaurant) as { name: string; area: string } | null
    : null;

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* Avatar + identity */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)] text-white text-2xl font-extrabold flex items-center justify-center uppercase shrink-0">
            {profile.name ? profile.name.charAt(0) : "S"}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] truncate">{profile.name}</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">@{profile.username}</p>
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

      {/* Active plan summary */}
      {activeSub && restaurant && (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-4">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Active Plan</p>
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
              <p className="text-xs text-[var(--color-text-muted)]">tokens left</p>
            </div>
          </div>
          <Link
            href="/student/dashboard"
            className="mt-3 block text-xs font-semibold text-[var(--color-brand-secondary)] hover:underline"
          >
            Go to dashboard →
          </Link>
        </div>
      )}

      {!activeSub && (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-4 text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-3">No active subscription</p>
          <Link href="/" className="text-sm font-semibold text-[var(--color-brand-secondary)] hover:underline">
            Browse messes →
          </Link>
        </div>
      )}

      {/* Edit profile form */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Edit profile</h2>
        <form action={updateStudentProfile} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Full name *</label>
            <input
              name="name"
              required
              defaultValue={profile.name ?? ""}
              placeholder="Your name"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Location</label>
            <input
              name="location"
              defaultValue={profile.location ?? ""}
              placeholder="e.g. Kothrud, Pune"
              className={inputCls}
            />
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
          <button type="submit" className="btn-primary py-2.5 text-sm">
            Save changes
          </button>
        </form>
      </div>

      {/* Subscription history */}
      {subHistory && subHistory.length > 0 && (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Subscription history</h2>
          <div className="space-y-0">
            {subHistory.map((sub) => {
              const restName =
                (Array.isArray(sub.restaurant) ? sub.restaurant[0] : sub.restaurant)?.name ?? "—";
              return (
                <div
                  key={sub.id}
                  className="flex items-start justify-between gap-3 py-3 border-b border-[var(--color-border)] last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{restName}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {sub.start_date as string} → {sub.end_date as string}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {(sub.slots as string[]).join(" + ")} · ₹{Number(sub.price_paid).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] rounded-full px-2.5 py-0.5 font-semibold shrink-0 mt-0.5 ${
                      sub.status === "active"  ? "bg-green-100 text-green-700" :
                      sub.status === "expired" ? "bg-gray-100 text-gray-500"  :
                                                 "bg-red-100 text-red-600"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-1">
        <form method="POST" action="/auth/logout">
          <button
            type="submit"
            className="w-full text-sm font-semibold text-red-600 hover:text-red-700 py-3.5 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
