// app/(auth)/layout.tsx
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Minimal brand mark */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-[3px] font-display text-[15px] font-bold tracking-[0.12em]"
        style={{ color: "#D63558" }}
      >
        <span className="-mr-0.5">PLAI</span>
        {/* Static bars, no animation on auth pages */}
        <span
          className="inline-flex items-center gap-[2.5px]"
          style={{ height: 16 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="rounded-full block"
              style={{ width: 3.5, height: "40%", background: "#D63558" }}
            />
          ))}
        </span>
      </Link>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
