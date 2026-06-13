import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import NudgeButton from "./NudgeButton";
import NotifyComposer from "@/components/NotifyComposer";
import { nowIST } from "@/lib/ist";

export const dynamic = "force-dynamic";

const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function SubscriberDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const [{ data: myProfile }, { data: restaurant }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("restaurants").select("id, name").eq("owner_id", user.id).single(),
  ]);

  if (!myProfile || myProfile.role !== "restaurant" || !restaurant) redirect("/restaurant/dashboard");

  const service = createServiceClient();

  // Fetch student profile + their active subscription at this restaurant
  const [{ data: studentProfile }, { data: subscription }] = await Promise.all([
    service.from("profiles").select("name, username, location, diet_pref").eq("id", studentId).single(),
    service
      .from("subscriptions")
      .select("id, slots, tokens_total, tokens_remaining, start_date, end_date")
      .eq("student_id", studentId)
      .eq("restaurant_id", restaurant.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (!studentProfile) redirect("/restaurant/subscribers");

  // Build 6-day attendance heatmap (today + 5 past days in IST)
  const now = nowIST();
  const heatmapDays: { date: string; label: string; dayAbbr: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    heatmapDays.push({
      date: dateStr,
      label: i === 0 ? "Today" : i === 1 ? "Yesterday" : dateStr.slice(5),
      dayAbbr: DAY_ABBR[(d.getDay() + 6) % 7],
    });
  }

  let heatmapData: Record<string, { lunch?: string; dinner?: string }> = {};
  if (subscription?.id) {
    const { data: redemptions } = await service
      .from("redemptions")
      .select("meal_date, meal_type, status")
      .eq("subscription_id", subscription.id)
      .in("meal_date", heatmapDays.map((d) => d.date));

    for (const r of redemptions ?? []) {
      const key = r.meal_date as string;
      if (!heatmapData[key]) heatmapData[key] = {};
      (heatmapData[key] as Record<string, string>)[r.meal_type as string] = r.status as string;
    }
  }

  // Overall skip stats
  let totalMeals = 0, totalSkips = 0;
  if (subscription?.id) {
    const { data: allRedemptions } = await service
      .from("redemptions")
      .select("status")
      .eq("subscription_id", subscription.id);

    totalMeals = (allRedemptions ?? []).length;
    totalSkips = (allRedemptions ?? []).filter((r) => r.status === "skipped").length;
  }

  const skipRate = totalMeals > 0 ? Math.round((totalSkips / totalMeals) * 100) : 0;
  const tokenPct = subscription
    ? Math.round((Number(subscription.tokens_remaining) / Number(subscription.tokens_total)) * 100)
    : 0;
  const slots = (subscription?.slots as string[] | null) ?? [];

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link href="/restaurant/subscribers" className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All subscribers
      </Link>

      {/* Profile card */}
      <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-[var(--color-brand-primary)]">
              {(studentProfile.name as string | null)?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] truncate">
              {studentProfile.name ?? "Unknown"}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">@{studentProfile.username}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {studentProfile.location && (
                <span className="text-xs border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-secondary)]">
                  📍 {studentProfile.location}
                </span>
              )}
              {studentProfile.diet_pref && (
                <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                  studentProfile.diet_pref === "veg" ? "bg-green-50 text-green-700 border border-green-200" :
                  studentProfile.diet_pref === "nonveg" ? "bg-red-50 text-red-700 border border-red-200" :
                  "bg-orange-50 text-orange-700 border border-orange-200"
                }`}>
                  {studentProfile.diet_pref === "veg" ? "🥦 Veg" : studentProfile.diet_pref === "nonveg" ? "🍗 Non-veg" : "🍱 Mix"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {!subscription ? (
        <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-6 text-center">
          <p className="text-[var(--color-text-muted)]">No active subscription found for this student.</p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Tokens" value={`${subscription.tokens_remaining}/${subscription.tokens_total}`} sub={`${tokenPct}%`} warn={tokenPct < 20} />
            <StatCard label="Skip rate" value={`${skipRate}%`} sub={`${totalSkips}/${totalMeals}`} warn={skipRate > 40} />
            <StatCard label="Expires" value={subscription.end_date as string} sub={slots.join(" + ")} />
          </div>

          {/* Heatmap */}
          <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-3 text-sm">6-day attendance</h2>
            <div className="grid grid-cols-6 gap-1.5">
              {heatmapDays.map(({ date, label, dayAbbr }) => {
                const day = heatmapData[date] ?? {};
                const lunchStatus = (day as Record<string, string>).lunch;
                const dinnerStatus = (day as Record<string, string>).dinner;
                const isToday = label === "Today";

                return (
                  <div key={date} className={`rounded-xl border px-1 py-2 text-center ${isToday ? "border-[var(--color-brand-primary)] bg-orange-50" : "border-[var(--color-border)] bg-white"}`}>
                    <p className={`text-[10px] font-bold mb-1 ${isToday ? "text-[var(--color-brand-primary)]" : "text-[var(--color-text-muted)]"}`}>
                      {dayAbbr}
                    </p>
                    <p className="text-[9px] text-[var(--color-text-muted)] mb-2">{label === "Today" || label === "Yesterday" ? label : date.slice(5)}</p>
                    {slots.includes("lunch") && (
                      <StatusDot status={lunchStatus} />
                    )}
                    {slots.includes("dinner") && (
                      <StatusDot status={dinnerStatus} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Taken</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-300 inline-block" />Skipped</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />Pending</span>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4 space-y-4">
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)] text-sm mb-1">Send nudge</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                Quick notification when token balance is running low.
              </p>
              <NudgeButton
                studentId={studentId}
                studentName={studentProfile.name as string ?? "Student"}
                tokensRemaining={Number(subscription.tokens_remaining)}
              />
            </div>

            <div className="border-t border-[var(--color-border)] pt-4">
              <h2 className="font-semibold text-[var(--color-text-primary)] text-sm mb-1">Custom message</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                Send any custom message — announcements, menu changes, schedule updates, etc.
              </p>
              <NotifyComposer
                studentId={studentId}
                studentName={studentProfile.name as string ?? "Student"}
                restaurantName={restaurant.name}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className={`rounded-[var(--radius-card)] border px-3 py-3 text-center ${warn ? "border-red-200 bg-red-50" : "bg-white border-[var(--color-border)] card-shadow-sm"}`}>
      <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>
      <p className={`text-base font-extrabold mt-0.5 ${warn ? "text-red-600" : "text-[var(--color-text-primary)]"}`}>{value}</p>
      <p className="text-[10px] text-[var(--color-text-muted)]">{sub}</p>
    </div>
  );
}

function StatusDot({ status }: { status?: string }) {
  return (
    <div className={`w-2 h-2 rounded-full mx-auto mb-0.5 ${
      status === "taken" ? "bg-green-400" :
      status === "skipped" ? "bg-red-300" :
      "bg-gray-200"
    }`} />
  );
}
