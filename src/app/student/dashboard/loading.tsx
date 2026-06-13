export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-44 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2 mt-1">
          <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Wallet card skeleton */}
      <div className="rounded-[var(--radius-card)] overflow-hidden h-44 bg-gray-200 animate-pulse" />

      {/* Daily actions skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl border-2 border-gray-200 p-4 space-y-3 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-9 w-full bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-7 w-full bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-[var(--radius-card)] px-4 py-3 space-y-2">
          <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-3">
            <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Plan strip skeleton */}
      <div className="bg-white rounded-[var(--radius-card)] px-5 py-4 flex gap-4">
        <div className="flex-1 space-y-1">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Calendar skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shrink-0 w-[calc(50vw-1.5rem)] sm:w-48 rounded-[var(--radius-card)] border border-gray-200 overflow-hidden">
              <div className="h-8 bg-gray-200 animate-pulse" />
              <div className="p-3 space-y-2 bg-white">
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
