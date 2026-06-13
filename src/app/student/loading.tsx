export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-7 w-44 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] h-44 bg-gray-200 animate-pulse" />

      <div className="space-y-2">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-[var(--radius-card)] bg-gray-200 animate-pulse" />
          <div className="h-24 rounded-[var(--radius-card)] bg-gray-200 animate-pulse" />
        </div>
      </div>

      <div className="h-16 rounded-[var(--radius-card)] bg-gray-200 animate-pulse" />

      <div className="space-y-2">
        <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[calc(50vw-1.5rem)] sm:w-48 h-28 rounded-[var(--radius-card)] bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
