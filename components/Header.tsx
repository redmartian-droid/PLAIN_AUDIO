"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { LayoutGrid, Settings, LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    plan?: string;
  } | null;
  title?: string;
  actions?: React.ReactNode;
  className?: string;
  transcribing?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  shortcut: string;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    exact: true,
    shortcut: "ctrl+H",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    shortcut: "ctrl+S",
  },
];

// ── Shortcut pill ─────────────────────────────────────────────────────────────

function ShortcutPill({ keys }: { keys: string }) {
  return (
    <span
      className={cn(
        "opacity-0 group-hover:opacity-100",
        "transition-opacity duration-150 ease-in-out",
        "inline-flex items-center px-1.5 py-0.5 rounded",
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

// ── Waveform mark ─────────────────────────────────────────────────────────────

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

// ── Header ─────────────────────────────────────────────────────────────────────

export function Header({
  user,
  title,
  actions,
  className,
  transcribing = false,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router, supabase]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;

      const key = e.key.toLowerCase();
      if (key === "h") {
        e.preventDefault();
        router.push("/dashboard");
      } else if (key === "s") {
        e.preventDefault();
        router.push("/dashboard/settings");
      } else if (key === "e") {
        e.preventDefault();
        handleSignOut();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router, handleSignOut]);

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const showCenterNav = !user;
  const isPrivacy = pathname === "/privacy";
  const isTerms = pathname === "/terms";
  const isBlog = pathname === "/blog" || pathname.startsWith("/blog/");

  return (
    <header
      className={cn(
        "h-[52px] flex items-center px-6 md:px-24 relative",
        "border-b border-border/50",
        "bg-background/90 backdrop-blur-[6px]",
        "sticky top-0 z-40",
        className,
      )}
    >
      {/* Left */}
      <div className="flex-1 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-[3px] font-display text-[15px] font-bold tracking-[0.12em]"
          style={{ color: "#D63558" }}
        >
          <span className="-mr-0.5">PLAI</span>
          <AudioBars active={transcribing} />
        </Link>
        {title && (
          <>
            <span className="text-border/60 select-none text-sm">/ </span>
            <span className="text-[13px] font-medium text-muted-foreground/70">
              {title}
            </span>
          </>
        )}
      </div>

      {/* Center — public nav (homepage + legal + blog, when not logged in) */}
      {showCenterNav && (
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link
            href="/blog"
            className={cn(
              "text-[13px] transition-colors",
              isBlog
                ? "text-foreground font-medium"
                : "text-muted-foreground/70 hover:text-foreground",
            )}
          >
            Blog
          </Link>
          <Link
            href="/privacy"
            className={cn(
              "text-[13px] transition-colors",
              isPrivacy
                ? "text-foreground font-medium"
                : "text-muted-foreground/70 hover:text-foreground",
            )}
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className={cn(
              "text-[13px] transition-colors",
              isTerms
                ? "text-foreground font-medium"
                : "text-muted-foreground/70 hover:text-foreground",
            )}
          >
            Terms
          </Link>
        </nav>
      )}

      {/* Right */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {actions}

        {user ? (
          <div ref={dropdownRef} className="relative">
            {/* Pill */}
            <button
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "flex items-center gap-[7px] pl-[5px] pr-2 py-1 rounded-full border outline-none",
                "[transition:background-color_120ms_ease,border-color_120ms_ease]",
                "active:scale-[.98]",
                open
                  ? "border-border/50 bg-accent"
                  : "border-transparent bg-transparent hover:bg-accent hover:border-border/30",
              )}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#f0eeeb" }}
              >
                <span
                  className="block text-[11px] font-semibold leading-none"
                  style={{ color: "#212121" }}
                >
                  {initial}
                </span>
              </span>
              <span className="hidden sm:block max-w-[110px] truncate text-[13px] font-medium tracking-[-0.01em] text-muted-foreground">
                {displayName}
              </span>
              <ChevronDown
                size={11}
                className={cn(
                  "transition-transform duration-150 shrink-0 opacity-60 ml-px text-muted-foreground",
                  open && "rotate-180",
                )}
              />
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-60 rounded-xl border border-border/50 bg-card overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-top-1.5 duration-[130ms]">
                {/* Identity */}
                <div className="flex items-center gap-[11px] px-4 py-[13px] border-b border-border/50">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "#f0eeeb" }}
                  >
                    <span
                      className="block text-[15px] font-semibold leading-none"
                      style={{ color: "#212121" }}
                    >
                      {initial}
                    </span>
                  </span>
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <p className="text-[13px] font-medium text-foreground tracking-[-0.015em] truncate leading-snug">
                      {displayName}
                    </p>
                    {user.email && (
                      <p className="text-[11px] font-mono text-muted-foreground truncate opacity-60">
                        {user.email}
                      </p>
                    )}
                    {user.plan && (
                      <span
                        className="inline-flex items-center mt-0.5 px-[6px] py-[1.5px] rounded-[4px] text-[10.5px] font-medium tracking-[0.02em] w-fit"
                        style={{ background: "#000000", color: "#ffffff" }}
                      >
                        {user.plan}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nav */}
                <div className="p-[5px] space-y-0.5">
                  {navItems.map(
                    ({ href, label, icon: Icon, exact, shortcut }) => {
                      const active = exact
                        ? pathname === href
                        : pathname.startsWith(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group flex items-center justify-between px-2.5 h-[34px] w-full rounded-lg text-[13px]",
                            "[transition:background-color_150ms_ease,color_150ms_ease,transform_200ms_cubic-bezier(.34,1.56,.64,1)]",
                            "active:scale-[.98] active:bg-[#D63558]/[0.10]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63558] focus-visible:ring-offset-2",
                            active
                              ? "bg-[#D63558]/[0.07] text-foreground"
                              : "text-muted-foreground/70 hover:text-foreground hover:bg-[#D63558]/[0.04]",
                          )}
                        >
                          <span className="flex items-center gap-[9px]">
                            <Icon
                              size={13}
                              aria-hidden
                              className={
                                active
                                  ? "text-[#D63558]"
                                  : "text-muted-foreground/50"
                              }
                            />
                            {label}
                          </span>
                          <ShortcutPill keys={shortcut} />
                        </Link>
                      );
                    },
                  )}
                </div>

                {/* Sign out */}
                <div className="p-[5px] border-t border-border/50">
                  <button
                    onClick={handleSignOut}
                    className={cn(
                      "group flex items-center justify-between px-2.5 h-[34px] w-full rounded-lg text-[13px]",
                      "[transition:background-color_150ms_ease,color_150ms_ease,transform_200ms_cubic-bezier(.34,1.56,.64,1)]",
                      "active:scale-[.98] active:bg-red-50/60",
                      "text-muted-foreground/70 hover:text-red-600 hover:bg-[#D63558]/[0.04]",
                    )}
                  >
                    <span className="flex items-center gap-[9px]">
                      <LogOut
                        size={13}
                        aria-hidden
                        className="text-muted-foreground/50 group-hover:text-red-500 transition-colors duration-150"
                      />
                      Sign out
                    </span>
                    <ShortcutPill keys="ctrl+E" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-primary/90 [transition:background-color_150ms_ease,box-shadow_150ms_ease] hover:shadow-md"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
