// app/(auth)/layout.tsx
import Link from "next/link";

const BAR_HEIGHTS = ["100%", "100%", "18%", "80%", "18%"];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-[52px] flex items-center px-6 md:px-24 border-b border-border/50 bg-background/90 backdrop-blur-[6px] shrink-0">
        <Link
          href="/"
          className="flex items-center gap-[3px] font-display text-[15px] font-bold tracking-[0.12em]"
          style={{ color: "#D63558" }}
        >
          <span className="-mr-0.5">PLAI</span>
          <span
            className="inline-flex items-center gap-[2.5px]"
            aria-hidden // added
            style={{ height: 16 }}
          >
            {BAR_HEIGHTS.map(
              (
                h,
                i, // changed: was [0,1,2,3,4].map((i)
              ) => (
                <span
                  key={i}
                  className="rounded-full block origin-center" // added: origin-center
                  style={{ width: 3.5, height: h, background: "#D63558" }} // changed: height was "40%"
                />
              ),
            )}
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
