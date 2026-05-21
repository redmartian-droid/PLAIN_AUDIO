"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Plus,
  Folder,
  LayoutDashboard,
  Settings,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COMMAND_ICON: Record<string, React.ElementType> = {
  search: FileText,
  new: Plus,
  folders: Folder,
  dashboard: LayoutDashboard,
  settings: Settings,
};

const SHORTCUT_PILL: Record<string, string> = {
  search: "ctrl+F",
  new: "ctrl+N",
  folders: "ctrl+O",
  dashboard: "ctrl+H",
  settings: "ctrl+S",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const commands = [
    {
      id: "search",
      label: "Search transcriptions",
      description: "Browse all recordings",
      action: () => {
        router.push("/dashboard/transcriptions");
        setOpen(false);
      },
    },
    {
      id: "new",
      label: "New transcription",
      description: "Upload and transcribe a file",
      action: () => {
        router.push("/dashboard/new");
        setOpen(false);
      },
    },
    {
      id: "folders",
      label: "View folders",
      description: "Organise your recordings",
      action: () => {
        router.push("/dashboard/folders");
        setOpen(false);
      },
    },
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Return to home",
      action: () => {
        router.push("/dashboard");
        setOpen(false);
      },
    },
    {
      id: "settings",
      label: "Settings",
      description: "Account and subscription",
      action: () => {
        router.push("/dashboard/settings");
        setOpen(false);
      },
    },
  ];

  const filtered = query.trim()
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  return (
    <>
      {open && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200"
          onClick={() => setOpen(false)}
        />
      )}

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command menu"
        shouldFilter={false}
        className={cn(
          "fixed left-1/2 top-[28%] z-50 -translate-x-1/2",
          "w-[calc(100%-2rem)] max-w-[640px]",
          "bg-[#0f0f0f]/90 backdrop-blur-xl",
          "border border-border/[0.08]",
          "rounded-xl",
          "shadow-[0_8px_40px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)]",
          "overflow-hidden",
          "origin-top animate-in fade-in-0 zoom-in-95 duration-150",
          "outline-none",
        )}
      >
        {/* ── Search bar ── */}
        <div className="flex items-center gap-2 px-3 h-[38px]">
          <Search
            size={14}
            strokeWidth={2}
            className="text-white/30 shrink-0"
            aria-hidden
          />
          <Command.Input
            placeholder="Type a command or search…"
            value={query}
            onValueChange={setQuery}
            className="flex-1 bg-transparent text-[13px] font-medium text-white placeholder:text-white/30 placeholder:font-normal focus:outline-none"
          />
          {!query && (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white/[0.08] text-[11px] text-white/40 font-sans border border-white/[0.06]">
              ctrl+K
            </kbd>
          )}
        </div>

        {filtered.length > 0 && <div className="h-px bg-white/[0.06] mx-3" />}

        {/* ── Results ── */}
        <Command.List className="max-h-[min(420px,50vh)] overflow-y-auto overscroll-contain py-1.5">
          {filtered.length === 0 ? (
            <Command.Empty className="py-10 text-center text-[13px] text-white/40">
              No commands found.
            </Command.Empty>
          ) : (
            <div className="px-1.5 space-y-0.5">
              {filtered.map((cmd) => {
                const Icon = COMMAND_ICON[cmd.id] ?? FileText;
                return (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.label}
                    onSelect={cmd.action}
                    className={cn(
                      "group",
                      "flex items-center gap-2",
                      "px-3 py-2",
                      "rounded-lg",
                      "cursor-pointer",
                      "transition-colors duration-75",
                      "data-[selected]:bg-white/[0.08]",
                      "hover:bg-white/[0.05]",
                    )}
                  >
                    <Icon
                      size={14}
                      strokeWidth={2}
                      className="text-white/40 shrink-0 transition-colors duration-75 group-data-[selected]:text-white/80"
                      aria-hidden
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white/70 truncate transition-colors duration-75 group-data-[selected]:text-white">
                        {cmd.label}
                      </p>
                      <p className="text-[11px] text-white/35 truncate">
                        {cmd.description}
                      </p>
                    </div>

                    {/* Pill: hidden by default, reveals on hover or keyboard selection */}
                    <span
                      className={cn(
                        "hidden sm:inline-flex items-center px-1.5 py-0.5 rounded",
                        "bg-white/[0.05] border border-white/[0.06]",
                        "text-[11px] text-white/30 font-sans tracking-wider",
                        // Invisible at rest; fades in on hover or cmdk selection
                        "opacity-0 group-hover:opacity-100 group-data-[selected]:opacity-100",
                        "transition-opacity duration-150 ease-in-out",
                        "group-data-[selected]:text-white/50 group-data-[selected]:border-white/[0.10]",
                      )}
                      aria-hidden
                    >
                      {SHORTCUT_PILL[cmd.id]}
                    </span>
                  </Command.Item>
                );
              })}
            </div>
          )}
        </Command.List>
      </Command.Dialog>
    </>
  );
}
