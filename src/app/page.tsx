import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getRestaurantCount(): Promise<{ count: number; error: string | null }> {
  try {
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from("restaurants")
      .select("*", { count: "exact", head: true });

    if (error) return { count: 0, error: error.message };
    return { count: count ?? 0, error: null };
  } catch (err) {
    return { count: 0, error: String(err) };
  }
}

export default async function HomePage() {
  const { count, error } = await getRestaurantCount();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      {/* Logo / wordmark */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-5xl font-extrabold tracking-tight text-[var(--color-brand-primary)]">
          Tiffino
        </span>
        <span className="text-[var(--color-text-secondary)] text-lg">
          Your daily mess, sorted.
        </span>
      </div>

      {/* Connection status card */}
      <div
        className="card-shadow rounded-[var(--radius-card)] bg-white px-8 py-6 flex flex-col items-center gap-3"
        style={{ minWidth: 320 }}
      >
        {error ? (
          <>
            <span className="text-2xl">⚠️</span>
            <p className="font-semibold text-[var(--color-brand-primary)]">Supabase connection failed</p>
            <p className="text-sm text-[var(--color-text-muted)] text-center">{error}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Fill in env vars and redeploy.</p>
          </>
        ) : (
          <>
            <span className="text-2xl">✅</span>
            <p className="font-semibold text-green-600">
              Connected to Supabase ✓ ({count} restaurant{count !== 1 ? "s" : ""})
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">Database is live and ready.</p>
          </>
        )}
      </div>

      {/* Sign-in buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <a
          href="/auth/student"
          className="flex-1 text-center bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] py-2.5 text-sm hover:opacity-90 transition-opacity"
        >
          Student sign in
        </a>
        <a
          href="/auth/restaurant"
          className="flex-1 text-center bg-[var(--color-brand-secondary)] text-white font-semibold rounded-[var(--radius-btn)] py-2.5 text-sm hover:opacity-90 transition-opacity"
        >
          Mess sign in
        </a>
      </div>
    </main>
  );
}
