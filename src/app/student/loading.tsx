export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-alt)] p-6">
      <header className="max-w-2xl mx-auto flex items-center justify-between mb-8">
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
      </header>
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5 space-y-3">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-2 mt-2">
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
