export default function TranscriptionLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-8 h-14 flex items-center">
        <div className="h-4 bg-mist/10 rounded w-48 animate-pulse" />
      </header>

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Meta cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-xl p-4 space-y-2 animate-pulse"
            >
              <div className="h-3 bg-mist/10 rounded w-12" />
              <div className="h-5 bg-mist/10 rounded w-16" />
            </div>
          ))}
        </div>

        {/* Summary skeleton */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-3 animate-pulse">
          <div className="h-4 bg-mist/10 rounded w-24" />
          <div className="space-y-2">
            <div className="h-3 bg-mist/10 rounded w-full" />
            <div className="h-3 bg-mist/10 rounded w-5/6" />
          </div>
        </div>

        {/* Transcript skeleton */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div className="h-4 bg-mist/10 rounded w-32 mb-4 animate-pulse" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-3 bg-mist/10 rounded w-full" />
              <div className="h-3 bg-mist/10 rounded w-10/12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
