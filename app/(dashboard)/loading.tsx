export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-56 border-r border-border bg-surface p-6 space-y-6">
        <div className="h-8 bg-mist/10 rounded w-24 animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-mist/10 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="mt-auto space-y-2">
          <div className="h-2 bg-mist/10 rounded-full w-full animate-pulse" />
          <div className="h-3 bg-mist/5 rounded w-3/4 animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <div className="h-10 bg-mist/10 rounded w-48 animate-pulse mb-2" />
            <div className="h-4 bg-mist/5 rounded w-32 animate-pulse" />
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl p-4 space-y-3"
              >
                <div className="h-3 bg-mist/10 rounded w-16 animate-pulse" />
                <div className="h-6 bg-mist/10 rounded w-20 animate-pulse" />
              </div>
            ))}
          </div>

          {/* List skeleton */}
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl h-16 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
