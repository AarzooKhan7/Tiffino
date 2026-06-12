export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-alt)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col items-center gap-6">
          <div className="h-12 w-36 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-5 w-72 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-shadow rounded-[var(--radius-card)] bg-white p-5 space-y-3">
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
