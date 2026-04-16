"use client";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-up">
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="font-display text-3xl font-light text-ink mb-2">
            Something went wrong
          </h1>
          <p className="text-mist text-sm mb-6">
            An unexpected error occurred. Please try again.
          </p>

          {process.env.NODE_ENV === "development" && error?.message && (
            <div className="bg-background rounded-lg p-3 mb-6 text-left">
              <code className="text-xs text-error font-mono break-words">
                {error.message}
              </code>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 px-4 py-2.5 bg-ink text-surface font-sans font-semibold rounded-full hover:bg-ink-soft transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="flex-1 px-4 py-2.5 bg-background border border-border text-ink font-sans font-semibold rounded-full hover:bg-mist/10 transition-colors"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
