import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const [{ data: profile }, { data: restaurant }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("restaurants").select("id, name").eq("owner_id", user.id).single(),
  ]);

  if (!profile || profile.role !== "restaurant") redirect("/");
  if (!restaurant) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--color-text-muted)]">Complete restaurant setup first.</p>
        <Link href="/restaurant/setup" className="btn-primary mt-4 inline-block px-6 py-2.5">Set up →</Link>
      </div>
    );
  }

  const service = createServiceClient();

  // Get all active subscriptions for this restaurant, join student profiles
  const { data: subs } = await service
    .from("subscriptions")
    .select("id, student_id, slots, tokens_total, tokens_remaining, start_date, end_date, status")
    .eq("restaurant_id", restaurant.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (!subs || subs.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Subscribers</h1>
        <div className="bg-white rounded-[var(--radius-card)] card-shadow px-6 py-12 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-semibold text-[var(--color-text-primary)]">No active subscribers yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Share your QR code so students can subscribe.</p>
        </div>
      </div>
    );
  }

  // Batch-fetch profiles for all student_ids
  const studentIds = subs.map((s) => s.student_id as string);
  const { data: profiles } = await service
    .from("profiles")
    .select("id, name, username, location, diet_pref")
    .in("id", studentIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  // Fetch total skips per subscription (count skipped redemptions)
  const subIds = subs.map((s) => s.id as string);
  const { data: skipRows } = await service
    .from("redemptions")
    .select("subscription_id")
    .in("subscription_id", subIds)
    .eq("status", "skipped");

  const skipCountMap = new Map<string, number>();
  for (const row of skipRows ?? []) {
    const sid = row.subscription_id as string;
    skipCountMap.set(sid, (skipCountMap.get(sid) ?? 0) + 1);
  }

  // Fetch total taken per subscription (for skip rate denominator)
  const { data: takenRows } = await service
    .from("redemptions")
    .select("subscription_id")
    .in("subscription_id", subIds)
    .in("status", ["taken", "skipped"]);

  const totalMap = new Map<string, number>();
  for (const row of takenRows ?? []) {
    const sid = row.subscription_id as string;
    totalMap.set(sid, (totalMap.get(sid) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          Subscribers
          <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">{subs.length} active</span>
        </h1>
      </div>

      <div className="space-y-3">
        {subs.map((sub) => {
          const profile = profileMap.get(sub.student_id as string);
          const skips = skipCountMap.get(sub.id as string) ?? 0;
          const total = totalMap.get(sub.id as string) ?? 0;
          const skipRate = total > 0 ? Math.round((skips / total) * 100) : 0;
          const tokenPct = Math.round((Number(sub.tokens_remaining) / Number(sub.tokens_total)) * 100);
          const slots = (sub.slots as string[] | null) ?? [];

          return (
            <Link
              key={sub.id as string}
              href={`/restaurant/subscribers/${sub.student_id}`}
              className="block bg-white rounded-[var(--radius-card)] card-shadow px-4 py-4 hover:shadow-md transition-shadow active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center shrink-0">
                  <span className="text-base font-bold text-[var(--color-brand-primary)]">
                    {(profile?.name as string | null)?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--color-text-primary)] truncate">
                      {profile?.name ?? "Unknown"}
                    </p>
                    <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                      {slots.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ")}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {profile?.location ?? "—"} · @{profile?.username ?? "—"}
                  </p>

                  {/* Token bar */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${tokenPct > 30 ? "bg-green-400" : tokenPct > 10 ? "bg-orange-400" : "bg-red-400"}`}
                        style={{ width: `${tokenPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[var(--color-text-muted)] shrink-0 tabular-nums">
                      {sub.tokens_remaining}/{sub.tokens_total} tokens
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                    <span className={skipRate > 40 ? "text-red-500 font-medium" : ""}>
                      Skip rate: {skipRate}%
                    </span>
                    <span>·</span>
                    <span>Expires {sub.end_date}</span>
                  </div>
                </div>

                <svg className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
