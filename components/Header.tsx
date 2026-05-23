"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutGrid,
  Settings,
  LogOut,
  ChevronDown,
  X,
  PanelLeft,
} from "lucide-react";
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
        "text-[#D63558]/60 font-mono text-[10px] tracking-wider leading-none whitespace-nowrap",
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
  return (
    <span className={cn("waveform-bars", className)} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={cn("waveform-bar", active && "active")} />
      ))}
    </span>
  );
}

// ── Avatar blob ───────────────────────────────────────────────────────────────

function Avatar({
  initial,
  size = "sm",
}: {
  initial: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "w-11 h-11" : "w-6 h-6";
  const txt = size === "lg" ? "text-[17px]" : "text-[11px]";
  return (
    <span
      className={cn(
        dim,
        "rounded-full flex items-center justify-center shrink-0",
      )}
      style={{ background: "#f0eeeb" }}
    >
      <span
        className={cn("block font-semibold leading-none", txt)}
        style={{ color: "#212121" }}
      >
        {initial}
      </span>
    </span>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

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

  const [open, setOpen] = useState(false); // desktop dropdown
  const [sheetOpen, setSheetOpen] = useState(false); // mobile bottom sheet
  const [drawerOpen, setDrawerOpen] = useState(false); // guest side drawer

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // ── Pill click: dropdown on desktop, sheet on mobile ─────────────────────
  const handlePillClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setSheetOpen((v) => !v);
    } else {
      setOpen((v) => !v);
    }
  };

  // ── Close dropdown on outside click ──────────────────────────────────────
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

  // ── Close everything on route change ─────────────────────────────────────
  useEffect(() => {
    setOpen(false);
    setSheetOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  // ── Body scroll lock for sheet + drawer ──────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = sheetOpen || drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen, drawerOpen]);

  // ── Escape closes everything ──────────────────────────────────────────────
  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSheetOpen(false);
        setDrawerOpen(false);
      }
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    setOpen(false);
    setSheetOpen(false);
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

  const isPrivacy = pathname === "/privacy";
  const isTerms = pathname === "/terms";
  const isBlog = pathname === "/blog" || pathname.startsWith("/blog/");

  const guestLinks = [
    { href: "/blog", label: "Blog", active: isBlog },
    { href: "/privacy", label: "Privacy", active: isPrivacy },
    { href: "/terms", label: "Terms", active: isTerms },
  ];

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <header
        className={cn(
          "h-[52px] flex items-center px-6 md:px-24",
          "border-b border-border/50",
          "bg-background/90 backdrop-blur-[6px]",
          "sticky top-0 z-40",
          className,
        )}
      >
        {/* Left */}
        <div className="flex-1 flex items-center gap-3">
          {/* Authenticated mobile: sidebar toggle + logo (logo hidden when sidebar open via CSS sibling, but we use JS state) */}
          {user ? (
            <>
              <button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("toggle-sidebar"))
                }
                className="sm:hidden p-2 -ml-2 rounded-lg active:bg-[#D63558]/10 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle sidebar"
              >
                <PanelLeft size={18} strokeWidth={1.5} />
              </button>
              {/* Logo hidden on mobile — lives in sidebar instead */}
              <div className="hidden sm:flex items-center gap-[3px] font-display text-[15px] font-bold tracking-[0.12em]">
                <Link href="/" style={{ color: "#D63558" }}>
                  <span className="-mr-0.5">PLAI</span>
                </Link>
                <AudioBars active={transcribing} />
              </div>
            </>
          ) : (
            /* Guest: logo always visible */
            <Link
              href="/"
              className="flex items-center gap-[3px] font-display text-[15px] font-bold tracking-[0.12em]"
              style={{ color: "#D63558" }}
            >
              <span className="-mr-0.5">PLAI</span>
              <AudioBars active={transcribing} />
            </Link>
          )}

          {title && (
            <>
              <span className="text-border/60 select-none text-sm">/</span>
              <span className="text-[13px] font-medium text-muted-foreground/70 truncate">
                {title}
              </span>
            </>
          )}
        </div>

        {/* Center — desktop public nav */}
        {!user && (
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {guestLinks.map(({ href, label, active }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-[13px] transition-colors",
                  active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground/70 hover:text-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {actions}

          {user ? (
            /* ── Authenticated pill ──────────────────────────────────────── */
            <div ref={dropdownRef} className="relative">
              <button
                onClick={handlePillClick}
                className={cn(
                  "flex items-center gap-[7px] pl-[5px] pr-2 py-1 rounded-full border outline-none cursor-pointer",
                  "[transition:background-color_120ms_ease,border-color_120ms_ease]",
                  "active:scale-[.98]",
                  open || sheetOpen
                    ? "border-border/50 bg-accent"
                    : "border-border/30 bg-accent hover:border-border/50",
                )}
                aria-expanded={open || sheetOpen}
                aria-haspopup="menu"
              >
                <Avatar initial={initial} size="sm" />
                <span className="hidden sm:block max-w-[110px] truncate text-[13px] font-medium tracking-[-0.01em] text-muted-foreground">
                  {displayName}
                </span>
                <ChevronDown
                  size={11}
                  className={cn(
                    "transition-transform duration-150 shrink-0 opacity-60 ml-px text-muted-foreground",
                    (open || sheetOpen) && "rotate-180",
                  )}
                />
              </button>

              {/* Desktop dropdown */}
              {open && (
                <div
                  className="absolute right-0 top-[calc(100%+6px)] w-60 rounded-xl border border-border/50 bg-card overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-top-1.5 duration-[130ms]"
                  role="menu"
                >
                  {/* Identity */}
                  <div className="flex items-center gap-[11px] px-4 py-[13px] border-b border-border/50">
                    <Avatar initial={initial} size="sm" />
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
                            role="menuitem"
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
                      role="menuitem"
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
            /* ── Guest ───────────────────────────────────────────────────── */
            <>
              {/* Hamburger — mobile/tablet only */}
              <button
                onClick={() => setDrawerOpen((v) => !v)}
                aria-label={drawerOpen ? "Close menu" : "Open menu"}
                aria-expanded={drawerOpen}
                className="flex md:hidden flex-col justify-center gap-[4.5px] w-8 h-8 rounded-lg hover:bg-[#f5f5f5] transition-colors items-center"
              >
                <span
                  className="block h-[1.5px] bg-[#888] rounded-full"
                  style={{
                    width: 18,
                    transition: "transform 240ms cubic-bezier(0.32,0.72,0,1)",
                    transform: drawerOpen
                      ? "translateY(6px) rotate(45deg)"
                      : "none",
                  }}
                />
                <span
                  className="block h-[1.5px] bg-[#888] rounded-full"
                  style={{
                    width: 13,
                    transition:
                      "opacity 180ms ease, transform 240ms cubic-bezier(0.32,0.72,0,1)",
                    opacity: drawerOpen ? 0 : 1,
                    transform: drawerOpen ? "scaleX(0)" : "scaleX(1)",
                  }}
                />
                <span
                  className="block h-[1.5px] bg-[#888] rounded-full"
                  style={{
                    width: 18,
                    transition: "transform 240ms cubic-bezier(0.32,0.72,0,1)",
                    transform: drawerOpen
                      ? "translateY(-6px) rotate(-45deg)"
                      : "none",
                  }}
                />
              </button>

              {/* Desktop auth nav */}
              <div className="hidden md:flex items-center gap-2">
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
            </>
          )}
        </div>
      </header>

      {/* ── Mobile bottom sheet — authenticated ──────────────────────────────── */}
      {user && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 sm:hidden"
            style={{
              background: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              opacity: sheetOpen ? 1 : 0,
              pointerEvents: sheetOpen ? "auto" : "none",
              transition: "opacity 320ms ease",
            }}
            onClick={() => setSheetOpen(false)}
            aria-hidden
          />

          {/* Sheet panel */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white flex flex-col"
            style={{
              borderRadius: "20px 20px 0 0",
              borderTop: "1px solid #f0f0f0",
              transform: sheetOpen ? "translateY(0)" : "translateY(100%)",
              transition: "transform 400ms cubic-bezier(0.32,0.72,0,1)",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Account menu"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div
                className="w-9 h-1 rounded-full"
                style={{ background: "#e0e0e0" }}
              />
            </div>

            {/* Identity block */}
            <div
              className="flex items-center gap-4 px-6 py-5 border-b border-[#f5f5f5]"
              style={{
                opacity: sheetOpen ? 1 : 0,
                transform: sheetOpen ? "translateY(0)" : "translateY(10px)",
                transition: sheetOpen
                  ? "opacity 300ms ease 80ms, transform 300ms cubic-bezier(0.32,0.72,0,1) 80ms"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              <Avatar initial={initial} size="lg" />
              <div className="min-w-0 flex flex-col gap-1">
                <p className="text-[15px] font-medium text-[#111] tracking-[-0.015em] truncate">
                  {displayName}
                </p>
                {user.email && (
                  <p className="text-[12px] font-mono text-[#aaa] truncate">
                    {user.email}
                  </p>
                )}
                {user.plan && (
                  <span
                    className="inline-flex items-center mt-0.5 px-[6px] py-[2px] rounded-[4px] text-[10.5px] font-medium tracking-[0.02em] w-fit"
                    style={{ background: "#000", color: "#fff" }}
                  >
                    {user.plan}
                  </span>
                )}
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-3 py-3">
              {navItems.map(({ href, label, icon: Icon, exact }, i) => {
                const active = exact
                  ? pathname === href
                  : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center gap-3 h-[52px] px-4 rounded-2xl text-[15px] transition-colors duration-150",
                      active
                        ? "bg-[#D63558]/[0.06] text-[#111]"
                        : "text-[#888] hover:text-[#111] hover:bg-[#fafafa]",
                    )}
                    style={{
                      opacity: sheetOpen ? 1 : 0,
                      transform: sheetOpen
                        ? "translateY(0)"
                        : "translateY(10px)",
                      transition: sheetOpen
                        ? `opacity 300ms ease ${160 + i * 55}ms, transform 300ms cubic-bezier(0.32,0.72,0,1) ${160 + i * 55}ms`
                        : "opacity 100ms ease, transform 100ms ease",
                    }}
                  >
                    <Icon
                      size={16}
                      aria-hidden
                      className={active ? "text-[#D63558]" : "text-[#ccc]"}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Divider */}
            <div className="mx-5 border-t border-[#f5f5f5]" />

            {/* Sign out */}
            <div
              className="px-3 py-3"
              style={{
                opacity: sheetOpen ? 1 : 0,
                transform: sheetOpen ? "translateY(0)" : "translateY(10px)",
                transition: sheetOpen
                  ? "opacity 300ms ease 280ms, transform 300ms cubic-bezier(0.32,0.72,0,1) 280ms"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 h-[52px] w-full px-4 rounded-2xl text-[15px] text-[#888] hover:text-red-500 hover:bg-red-50/60 transition-colors duration-150"
              >
                <LogOut
                  size={16}
                  aria-hidden
                  className="text-[#ccc] group-hover:text-red-400 transition-colors"
                />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Side drawer — guests, mobile/tablet only ──────────────────────────── */}
      {!user && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 md:hidden"
            style={{
              background: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              opacity: drawerOpen ? 1 : 0,
              pointerEvents: drawerOpen ? "auto" : "none",
              transition: "opacity 350ms ease",
            }}
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <div
            className="fixed right-0 top-0 h-full z-50 flex flex-col md:hidden bg-white"
            style={{
              width: 280,
              borderLeft: "1px solid #f0f0f0",
              transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
              transition: "transform 380ms cubic-bezier(0.32,0.72,0,1)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Panel header */}
            <div className="h-[52px] flex items-center justify-between px-5 border-b border-[#f0f0f0] shrink-0">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-[3px] font-display text-[15px] font-bold tracking-[0.12em]"
                style={{ color: "#D63558" }}
              >
                <span className="-mr-0.5">PLAI</span>
                <AudioBars active={false} />
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#bbb] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
                aria-label="Close menu"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col px-3 pt-6 pb-4">
              <p
                className="font-mono text-[9px] tracking-[0.22em] uppercase px-3 mb-5"
                style={{ color: "#d0d0d0" }}
              >
                — navigation
              </p>

              {guestLinks.map(({ href, label, active }, i) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center h-11 px-3 rounded-xl text-[15px] transition-colors duration-150",
                    active
                      ? "text-[#111] font-medium bg-[#f7f7f7]"
                      : "text-[#999] hover:text-[#111] hover:bg-[#fafafa]",
                  )}
                  style={{
                    opacity: drawerOpen ? 1 : 0,
                    transform: drawerOpen
                      ? "translateX(0)"
                      : "translateX(14px)",
                    transition: drawerOpen
                      ? `opacity 300ms ease ${100 + i * 55}ms, transform 300ms cubic-bezier(0.32,0.72,0,1) ${100 + i * 55}ms`
                      : "opacity 120ms ease, transform 120ms ease",
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mx-5 border-t border-[#f5f5f5]" />

            {/* Auth CTAs */}
            <div
              className="flex flex-col gap-2 px-4 py-6"
              style={{
                opacity: drawerOpen ? 1 : 0,
                transform: drawerOpen ? "translateY(0)" : "translateY(10px)",
                transition: drawerOpen
                  ? "opacity 300ms ease 260ms, transform 300ms cubic-bezier(0.32,0.72,0,1) 260ms"
                  : "opacity 120ms ease, transform 120ms ease",
              }}
            >
              <Link
                href="/signup"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center h-11 rounded-2xl text-[14px] font-semibold text-white"
                style={{ background: "#D63558" }}
              >
                Get started
              </Link>
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center h-11 rounded-2xl border border-[#ebebeb] text-[14px] text-[#888] hover:text-[#111] transition-colors"
              >
                Sign in
              </Link>
            </div>

            {/* System footer */}
            <div
              className="px-6 pb-8"
              style={{
                opacity: drawerOpen ? 1 : 0,
                transition: drawerOpen
                  ? "opacity 300ms ease 320ms"
                  : "opacity 100ms ease",
              }}
            >
              <p
                className="font-mono text-[9px] tracking-[0.22em] uppercase"
                style={{ color: "#e0e0e0" }}
              >
                system ready
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
