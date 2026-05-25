"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutGrid,
  LayoutList,
  Plus,
  FolderIcon,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NewFolderModal } from "./NewFolderModal";

interface SidebarProps {
  plan?: string;
  dailyUsed?: number;
  dailyLimit?: number;
  folders?: { id: string; name: string }[];
}

const FOLDER_CAP = 3;
const B = "#D63558";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  shortcut?: string;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Recent files",
    icon: LayoutGrid,
    exact: true,
    shortcut: "ctrl+1",
  },
  {
    href: "/dashboard/transcriptions",
    label: "All transcriptions",
    icon: LayoutList,
    shortcut: "ctrl+2",
  },
];

function ShortcutPill({ keys }: { keys: string }) {
  return (
    <span
      className={cn(
        "opacity-0 group-hover:opacity-100",
        "transition-opacity duration-150 ease-in-out",
        "hidden sm:inline-flex items-center px-1.5 py-0.5 rounded",
        "text-[#D63558]/60",
        "font-mono text-[10px] tracking-wider leading-none",
        "whitespace-nowrap",
      )}
      aria-hidden
    >
      {keys}
    </span>
  );
}

function navLinkClass(active: boolean) {
  return cn(
    "group",
    "flex items-center justify-between w-full px-2.5 rounded-lg",
    "min-h-[44px] sm:min-h-[34px]",
    "text-[13px]",
    "[transition:background-color_150ms_ease,color_150ms_ease,transform_200ms_cubic-bezier(.34,1.56,.64,1),opacity_150ms_ease]",
    "active:scale-[.98] active:bg-[#D63558]/[0.10]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63558] focus-visible:ring-offset-2",
    active
      ? "bg-[#D63558]/[0.07] text-foreground font-normal"
      : "text-muted-foreground/70 hover:text-foreground hover:bg-[#D63558]/[0.04] font-normal",
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label px-2.5 mb-1.5">{children}</p>;
}

function LogoMark({ transcribing = false }: { transcribing?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-[3px] font-display text-[15px] font-bold tracking-[0.12em] leading-none"
      style={{ color: "#D63558" }}
    >
      <span className="-mr-0.5">PLAI</span>
      <AudioBars active={transcribing} />
    </Link>
  );
}

function AudioBars({
  active = false,
  className,
}: {
  active?: boolean;
  className?: string;
}) {
  const bars: [string, string, string][] = [
    ["100%", "0ms", "600ms"],
    ["100%", "180ms", "500ms"],
    ["18%", "80ms", "700ms"],
    ["80%", "260ms", "550ms"],
    ["18%", "140ms", "650ms"],
  ];

  return (
    <span
      className={cn("inline-flex items-center gap-[2.5px]", className)}
      aria-hidden
      style={{ height: 16 }}
    >
      {bars.map(([h, delay, duration], i) => (
        <span
          key={i}
          className="rounded-full block origin-center"
          style={{
            width: 3.5,
            height: h,
            background: "#D63558",
            animationName: active ? "waveBar" : undefined,
            animationDuration: duration,
            animationDelay: delay,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
          }}
        />
      ))}
    </span>
  );
}

export function Sidebar({
  plan = "free",
  dailyUsed = 0,
  dailyLimit = 3,
  folders = [],
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const usagePercent =
    dailyLimit === Infinity ? 0 : Math.min((dailyUsed / dailyLimit) * 100, 100);
  const isPro = plan === "pro";
  const atLimit = dailyUsed >= dailyLimit;

  const visibleFolders = folders.slice(0, FOLDER_CAP);
  const overflowCount = folders.length - FOLDER_CAP;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onToggle = () => setMobileOpen((v) => !v);
    window.addEventListener("toggle-sidebar", onToggle);
    return () => window.removeEventListener("toggle-sidebar", onToggle);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;
      if (!e.metaKey && !e.ctrlKey) return;
      const key = e.key.toLowerCase();
      const match = navItems.find((item) => item.shortcut?.endsWith(key));
      if (match) {
        e.preventDefault();
        router.push(match.href);
      }
      if (key === "n") {
        e.preventDefault();
        setIsModalOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <>
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed sm:static inset-y-0 left-0 z-50",
          "w-[280px] sm:w-56 shrink-0",
          "bg-[#F8F7F4] sm:bg-transparent",
          "flex flex-col h-full",
          "px-4 pt-0 sm:pl-0 sm:pr-4 sm:pt-8",
          "transition-transform duration-300 ease-[cubic-bezier(.32,.72,.6,1)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
        )}
        style={{ borderRight: "1px solid #E2E0DB" }}
      >
        {/* Mobile header — 52px to match <Header />, PanelLeft flipped to indicate open/close */}
        <div className="sm:hidden flex items-center justify-between h-[52px] shrink-0 px-2.5">
          <LogoMark />
          <button
            onClick={() => setMobileOpen(false)}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl -mr-1",
              "text-muted-foreground hover:text-foreground",
              "transition-colors active:bg-[#D63558]/10",
            )}
            aria-label="Close sidebar"
          >
            <PanelLeft size={18} strokeWidth={1.5} className="scale-x-[-1]" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto pt-14 sm:pt-0">
          {/* Shortcuts */}
          <div>
            <SectionLabel>shortcuts</SectionLabel>
            <nav className="space-y-0.5" aria-label="Main navigation">
              {navItems.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={navLinkClass(active)}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <item.icon
                        size={13}
                        aria-hidden
                        style={{ color: active ? B : undefined }}
                        className={
                          active ? undefined : "text-muted-foreground/50"
                        }
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.shortcut && <ShortcutPill keys={item.shortcut} />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Folders */}
          <div>
            <SectionLabel>folders</SectionLabel>
            <nav className="space-y-0.5" aria-label="Folders">
              {visibleFolders.map((folder) => {
                const active = pathname === `/dashboard/folders/${folder.id}`;
                return (
                  <Link
                    key={folder.id}
                    href={`/dashboard/folders/${folder.id}`}
                    aria-current={active ? "page" : undefined}
                    className={navLinkClass(active)}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <FolderIcon
                        size={13}
                        aria-hidden
                        style={{ color: active ? B : undefined }}
                        className={
                          active ? undefined : "text-muted-foreground/50"
                        }
                      />
                      <span className="truncate">{folder.name}</span>
                    </span>
                  </Link>
                );
              })}

              {overflowCount > 0 && (
                <Link
                  href="/dashboard/folders"
                  className={navLinkClass(pathname === "/dashboard/folders")}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="text-[11px] font-mono text-muted-foreground/30 w-3.5 text-center tabular-nums"
                      aria-hidden
                    >
                      +{overflowCount}
                    </span>
                    <span className="text-muted-foreground/50">
                      {overflowCount === 1
                        ? "1 more folder"
                        : `${overflowCount} more`}
                    </span>
                  </span>
                </Link>
              )}

              <button
                onClick={() => setIsModalOpen(true)}
                className={cn(navLinkClass(false), "bg-transparent")}
                style={{ color: B }}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Plus size={13} aria-hidden style={{ color: B }} />
                  New folder
                </span>
                <ShortcutPill keys="ctrl+N" />
              </button>
            </nav>
          </div>
        </div>

        {/* Usage */}
        {!isPro && (
          <div
            className="mt-4 rounded-xl p-3 flex flex-col gap-2"
            style={{
              background: "#F0EEEB",
              border: "1px solid #E2E0DB",
              marginBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="section-label text-[#AAA8A4]">
                {dailyUsed} of {dailyLimit} today
              </span>
              {atLimit && (
                <span className="section-label text-[#D63558]">
                  limit reached
                </span>
              )}
            </div>

            <div
              className="h-[2px] rounded-full overflow-hidden bg-[#E2E0DB]"
              role="progressbar"
              aria-valuenow={dailyUsed}
              aria-valuemin={0}
              aria-valuemax={dailyLimit}
              aria-label="Daily transcription usage"
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${usagePercent}%`,
                  backgroundColor: atLimit ? "#D63558" : "#0D0D0D",
                  opacity: atLimit ? 1 : 0.25,
                }}
              />
            </div>

            <Link
              href="/dashboard/settings#upgrade"
              className="flex items-center justify-center w-full min-h-[32px] rounded-lg transition-colors active:scale-[.97] section-eyebrow bg-[#0D0D0D] text-[#F8F7F4]"
            >
              Go Unlimited →
            </Link>
          </div>
        )}
      </aside>

      <NewFolderModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(folder) => {
          router.push(`/dashboard/folders/${folder.id}`);
        }}
      />
    </>
  );
}
