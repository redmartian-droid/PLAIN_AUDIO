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
        <Link href="/" className="flex items-center">
          <img src="/logo.svg" alt="PLAIN" className="h-[30px] w-auto" />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
