"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutGrid, Clock, Plus, FolderIcon } from "lucide-react";
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
    icon: Clock,
    shortcut: "ctrl+2",
  },
];

function ShortcutPill({ keys }: { keys: string }) {
  return (
    <span
      className={cn(
        // Hidden by default, fades in on parent group hover
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
    "flex items-center justify-between w-full min-h-[34px] px-2.5 rounded-lg",
    "text-[13px]",
    // Smooth color + scale transitions; spring-like pop on release
    "[transition:background-color_150ms_ease,color_150ms_ease,transform_200ms_cubic-bezier(.34,1.56,.64,1),opacity_150ms_ease]",
    // Pressed: step darker than hover — tactile without new hues
    "active:scale-[.98] active:bg-[#D63558]/[0.10]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63558] focus-visible:ring-offset-2",
    active
      ? "bg-[#D63558]/[0.07] text-foreground font-normal"
      : "text-muted-foreground/70 hover:text-foreground hover:bg-[#D63558]/[0.04] font-normal",
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="px-2.5 mb-1.5 select-none"
      style={{
        fontFamily: "var(--font-mono,'Courier New',monospace)",
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#AAA8A4",
      }}
    >
      {children}
    </p>
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

  const usagePercent =
    dailyLimit === Infinity ? 0 : Math.min((dailyUsed / dailyLimit) * 100, 100);
  const isPro = plan === "pro";
  const atLimit = dailyUsed >= dailyLimit;

  const visibleFolders = folders.slice(0, FOLDER_CAP);
  const overflowCount = folders.length - FOLDER_CAP;

  // ── Global shortcut listeners ─────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
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
      <aside
        className="w-56 shrink-0 flex flex-col h-full pt-8 pr-4"
        style={{ borderRight: "1px solid #E2E0DB" }}
      >
        <div className="flex-1 space-y-5">
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
            className="mb-6 rounded-xl p-3 flex flex-col gap-2"
            style={{ background: "#F0EEEB", border: "1px solid #E2E0DB" }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: "var(--font-mono,'Courier New',monospace)",
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  color: "#AAA8A4",
                }}
              >
                {dailyUsed} of {dailyLimit} today
              </span>
              {atLimit && (
                <span
                  style={{
                    fontFamily: "var(--font-mono,'Courier New',monospace)",
                    fontSize: 10,
                    color: B,
                  }}
                >
                  limit reached
                </span>
              )}
            </div>

            <div
              className="h-[2px] rounded-full overflow-hidden"
              style={{ background: "#E2E0DB" }}
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
                  background: atLimit ? B : "#0D0D0D",
                  opacity: atLimit ? 1 : 0.25,
                }}
              />
            </div>

            <Link
              href="/dashboard/settings#upgrade"
              className="flex items-center justify-center w-full min-h-[32px] rounded-lg transition-colors active:scale-[.97]"
              style={{
                background: "#0D0D0D",
                color: "#F8F7F4",
                fontFamily: "var(--font-mono,'Courier New',monospace)",
                fontSize: 10.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
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
