export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 rounded-lg bg-white/8" />
        <div className="h-8 w-52 rounded-lg bg-white/8" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-white/8 bg-[#1F2535]"
          />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-64 rounded-xl border border-white/8 bg-[#1F2535]" />
        <div className="h-64 rounded-xl border border-white/8 bg-[#1F2535]" />
      </div>

      {/* Bar chart */}
      <div className="h-52 rounded-xl border border-white/8 bg-[#1F2535]" />

      {/* Agent grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-52 rounded-xl border border-white/8 bg-[#1F2535]"
          />
        ))}
      </div>

      {/* Activity feed */}
      <div className="h-64 rounded-xl border border-white/8 bg-[#1F2535]" />
    </div>
  )
}
