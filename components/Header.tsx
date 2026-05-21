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
    <span className="kbd-pill" aria-hidden>
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

      if (!(e.metaKey || e.ctrlKey)) return;

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
    <header className={cn("header-bar", className)}>
      {/* Left */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <Link href="/" className="brand-mark flex-shrink-0">
          <span>PLAI</span>
          <AudioBars active={transcribing} />
        </Link>
        {title && (
          <>
            <span className="breadcrumb-divider flex-shrink-0">/ </span>
            <span className="breadcrumb-title truncate">{title}</span>
          </>
        )}
      </div>

      {/* Center — public nav (hidden on mobile via CSS) */}
      {showCenterNav && (
        <nav className="nav-landing">
          <Link
            href="/blog"
            className={cn("nav-landing-link", isBlog && "active")}
          >
            Blog
          </Link>
          <Link
            href="/privacy"
            className={cn("nav-landing-link", isPrivacy && "active")}
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className={cn("nav-landing-link", isTerms && "active")}
          >
            Terms
          </Link>
        </nav>
      )}

      {/* Right */}
      <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
        {actions}

        {user ? (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className={cn("user-pill", open && "open")}
              aria-expanded={open}
              aria-haspopup="menu"
            >
              <span className="avatar">
                <span className="avatar-text">{initial}</span>
              </span>
              <span className="user-pill-name">{displayName}</span>
              <ChevronDown
                size={11}
                className={cn("user-pill-chevron", open && "open")}
              />
            </button>

            {open && (
              <div className="dropdown-panel" role="menu">
                {/* Identity */}
                <div className="dropdown-identity">
                  <span className="avatar avatar-lg">
                    <span className="avatar-text avatar-text-lg">
                      {initial}
                    </span>
                  </span>
                  <div className="dropdown-identity-meta">
                    <p className="dropdown-identity-name">{displayName}</p>
                    {user.email && (
                      <p className="dropdown-identity-email">{user.email}</p>
                    )}
                    {user.plan && (
                      <span className="dropdown-identity-plan">
                        {user.plan}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nav */}
                <div className="dropdown-nav">
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
                          role="menuitem"
                          className={cn(
                            "dropdown-link group",
                            active && "active",
                          )}
                        >
                          <span className="flex items-center gap-[9px]">
                            <Icon
                              size={13}
                              aria-hidden
                              className={cn(
                                "dropdown-link-icon",
                                active ? "active" : "inactive",
                              )}
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
                <div className="dropdown-nav border-t border-border/50">
                  <button
                    onClick={handleSignOut}
                    role="menuitem"
                    className="dropdown-signout group"
                  >
                    <span className="flex items-center gap-[9px]">
                      <LogOut
                        size={13}
                        aria-hidden
                        className="dropdown-signout-icon"
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
          <div className="nav-guest">
            <Link href="/login" className="btn-guest">
              Sign in
            </Link>
            <Link href="/signup" className="btn-pill-primary">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
