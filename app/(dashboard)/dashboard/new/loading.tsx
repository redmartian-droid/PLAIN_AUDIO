export default function NewTranscriptionLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-8 h-14 flex items-center">
        <div className="h-4 bg-mist/10 rounded w-32 animate-pulse" />
      </header>

      <div className="flex-1 p-8 max-w-2xl mx-auto w-full space-y-8">
        {/* Step indicator skeleton */}
        <div className="flex items-center justify-between mb-8 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-mist/10" />
              {i < 2 && <div className="w-12 h-1 bg-mist/10" />}
            </div>
          ))}
        </div>

        {/* Drop zone skeleton */}
        <div className="border-2 border-dashed border-border rounded-2xl p-16 bg-background flex flex-col items-center justify-center text-center animate-pulse">
          <div className="w-12 h-12 rounded-lg bg-mist/10 mb-4" />
          <div className="h-4 bg-mist/10 rounded w-32 mb-2" />
          <div className="h-3 bg-mist/5 rounded w-48" />
        </div>

        {/* Title input skeleton */}
        <div>
          <div className="h-3 bg-mist/10 rounded w-16 mb-2" />
          <div className="h-10 bg-surface border border-border rounded-lg animate-pulse" />
        </div>

        {/* Settings section skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-mist/10 rounded w-24 animate-pulse" />
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-surface border border-border rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Button skeleton */}
        <div className="h-12 bg-mist/10 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
