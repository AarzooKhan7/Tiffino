import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import MarkReadButton from "./MarkReadButton";

export const dynamic = "force-dynamic";

const TYPE_ICON: Record<string, string> = {
  nudge:           "🔔",
  low_balance:     "💰",
  expiry_warning:  "⏰",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/student");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "student") redirect("/");

  const service = createServiceClient();
  const { data: notifications } = await service
    .from("notifications")
    .select("id, type, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = notifications ?? [];
  const unread = list.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          Notifications
          {unread > 0 && (
            <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
              {unread} unread
            </span>
          )}
        </h1>
        {unread > 0 && <MarkReadButton userId={user.id} />}
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-[var(--radius-card)] card-shadow px-6 py-14 text-center">
          <p className="text-4xl mb-3">🔕</p>
          <p className="font-semibold text-[var(--color-text-primary)]">No notifications yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            You&apos;ll see alerts for low balance, plan expiry, and mess nudges here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((n) => (
            <div
              key={n.id as string}
              className={`rounded-[var(--radius-card)] px-4 py-4 card-shadow-sm flex gap-3 border transition-colors ${
                n.read
                  ? "bg-white border-[var(--color-border)]"
                  : "bg-orange-50 border-orange-200"
              }`}
            >
              <span className="text-xl shrink-0 mt-0.5">
                {TYPE_ICON[n.type as string] ?? "📢"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--color-text-primary)] leading-snug">
                  {n.message as string}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                  {new Date(n.created_at as string).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
