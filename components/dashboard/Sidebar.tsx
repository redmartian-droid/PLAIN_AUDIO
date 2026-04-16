"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Clock, FolderOpen, Settings, LogOut, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userName?: string | null;
  plan?: string;
  dailyUsed?: number;
  dailyLimit?: number;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/dashboard/transcriptions", label: "All transcriptions", icon: Clock },
  { href: "/dashboard/folders", label: "Folders", icon: FolderOpen },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ userName, plan = "free", dailyUsed = 0, dailyLimit = 3 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const usagePercent = dailyLimit === Infinity ? 0 : Math.min((dailyUsed / dailyLimit) * 100, 100);
  const isPro = plan === "pro";

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center border-b border-border">
        <Link href="/dashboard" className="font-display text-xl font-bold text-ink">
          Kung<span className="text-terra">wi</span>
        </Link>
      </div>

      {/* New transcription button */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/dashboard/new"
          className="flex items-center justify-center gap-2 w-full bg-terra text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-terra-dark transition-all hover:shadow-md hover:shadow-terra/20"
        >
          <Plus size={15} />
          New transcription
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-terra-light text-terra-dark"
                  : "text-mist hover:text-ink hover:bg-parchment"
              )}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Usage + plan */}
      <div className="px-4 py-4 border-t border-border space-y-3">
        {!isPro && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-mist">Daily usage</span>
              <span className="text-xs font-semibold text-ink">{dailyUsed}/{dailyLimit}</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-terra rounded-full transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            {dailyUsed >= dailyLimit && (
              <p className="text-xs text-terra mt-1.5 font-medium">Limit reached today</p>
            )}
          </div>
        )}

        {!isPro && (
          <Link
            href="/dashboard/settings#upgrade"
            className="flex items-center justify-center gap-1.5 w-full border border-terra/30 text-terra text-xs font-semibold py-2 rounded-lg hover:bg-terra-light transition-colors"
          >
            ✦ Upgrade to Pro
          </Link>
        )}

        {/* User */}
        <div className="flex items-center gap-2.5 pt-1">
          <div className="w-7 h-7 rounded-full bg-terra-light flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-terra">
              {(userName || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-ink truncate">{userName || "User"}</p>
            <p className="text-xs text-mist capitalize">{plan} plan</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-mist hover:text-ink transition-colors p-1"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
