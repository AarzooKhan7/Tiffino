export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5 space-y-3">
        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5 space-y-3">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 rounded-lg border border-[var(--color-border)] bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-shadow rounded-[var(--radius-card)] bg-white px-4 py-4 h-20 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
