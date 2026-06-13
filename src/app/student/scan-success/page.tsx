import Link from "next/link";

export default async function ScanSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ slot?: string; restaurant?: string; tokens?: string; time?: string }>;
}) {
  const params = await searchParams;
  const slot       = params.slot ?? "meal";
  const restaurant = params.restaurant ? decodeURIComponent(params.restaurant) : "your mess";
  const tokens     = params.tokens ? Number(params.tokens) : null;
  const time       = params.time ? decodeURIComponent(params.time) : new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const date       = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });

  const isLunch = slot === "lunch";
  const slotLabel = isLunch ? "Lunch" : "Dinner";
  const slotEmoji = isLunch ? "🌞" : "🌙";

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Check animation */}
        <div className="flex justify-center mb-8">
          <div className="relative w-28 h-28">
            {/* Outer pulse ring */}
            <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-40" />
            {/* Circle */}
            <div className="relative w-28 h-28 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Token Consumed!</h1>
          <p className="text-[var(--color-text-muted)] mt-1.5 text-sm">Enjoy your meal 🙏</p>
        </div>

        {/* Meal detail card */}
        <div className="bg-white rounded-[var(--radius-card)] card-shadow overflow-hidden mb-4">
          {/* Header stripe */}
          <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-500" />

          <div className="px-5 py-5 space-y-3">
            <Row label="Meal" value={`${slotEmoji} ${slotLabel}`} />
            <Row label="Restaurant" value={restaurant} />
            <Row label="Date" value={date} />
            <Row label="Time" value={`${time} IST`} />
            {tokens !== null && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-secondary)]">Tokens remaining</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[var(--color-brand-primary)]">{tokens}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">left</span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-brand-primary)] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (tokens / 30) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Low token warning */}
        {tokens !== null && tokens <= 5 && tokens > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-[var(--radius-card)] px-4 py-3 mb-4 text-center">
            <p className="text-sm font-semibold text-amber-800">⚠ Only {tokens} token{tokens === 1 ? "" : "s"} left</p>
            <p className="text-xs text-amber-700 mt-0.5">Renew your plan soon to keep meals uninterrupted.</p>
          </div>
        )}
        {tokens === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-[var(--radius-card)] px-4 py-3 mb-4 text-center">
            <p className="text-sm font-semibold text-red-700">No tokens remaining</p>
            <p className="text-xs text-red-600 mt-0.5">This was your last token. Please renew your plan.</p>
          </div>
        )}

        <Link
          href="/student/dashboard"
          className="btn-primary w-full py-3.5 text-sm rounded-xl flex items-center justify-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--color-text-primary)] text-right">{value}</span>
    </div>
  );
}
