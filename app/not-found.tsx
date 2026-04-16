import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background dot-grid flex items-center justify-center p-4">
      <div className="text-center max-w-md animate-fade-up">
        <h1 className="font-display text-7xl md:text-8xl font-light text-ink mb-6">
          404
        </h1>
        <p className="text-ink-soft text-lg mb-8">
          This page doesn't exist. Let's get you back on track.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 py-3 bg-ink text-surface font-sans font-semibold rounded-full hover:bg-ink-soft transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
