export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-alt)]">
      <div className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card-shadow rounded-[var(--radius-card)] bg-white px-5 py-4 h-24 animate-pulse" />
        ))}
      </div>
    </main>
  );
}
