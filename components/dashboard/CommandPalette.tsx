"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const commands = [
    {
      id: "search",
      label: "Search transcriptions",
      description: "Go to search",
      action: () => {
        router.push("/dashboard/transcriptions");
        setOpen(false);
      },
    },
    {
      id: "new",
      label: "New transcription",
      description: "Create a new transcription",
      action: () => {
        router.push("/dashboard/new");
        setOpen(false);
      },
    },
    {
      id: "folders",
      label: "View folders",
      description: "Go to folders",
      action: () => {
        router.push("/dashboard/folders");
        setOpen(false);
      },
    },
    {
      id: "dashboard",
      label: "Go to dashboard",
      description: "Return to main dashboard",
      action: () => {
        router.push("/dashboard");
        setOpen(false);
      },
    },
    {
      id: "settings",
      label: "Settings",
      description: "Manage account and subscription",
      action: () => {
        router.push("/dashboard/settings");
        setOpen(false);
      },
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      <Command.Dialog open={open} onOpenChange={setOpen} label="Command Menu">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-surface">
          <Search size={16} className="text-mist" />
          <Command.Input
            placeholder="Search commands..."
            value={query}
            onValueChange={setQuery}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder-mist"
          />
          <div className="text-xs text-mist px-2 py-1 rounded bg-surface">
            ESC
          </div>
        </div>

        <Command.List className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <Command.Empty className="py-6 text-center text-sm text-mist">
              No commands found.
            </Command.Empty>
          ) : (
            filteredCommands.map((cmd) => (
              <Command.Item
                key={cmd.id}
                value={cmd.id}
                onSelect={cmd.action}
                className="px-4 py-3 flex items-start justify-between cursor-pointer hover:bg-surface transition-colors data-[selected=true]:bg-terra-light"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{cmd.label}</p>
                  <p className="text-xs text-mist">{cmd.description}</p>
                </div>
              </Command.Item>
            ))
          )}
        </Command.List>

        <div className="border-t border-border px-4 py-2 bg-parchment text-xs text-mist">
          Press <span className="font-semibold">⌘K</span> to toggle
        </div>
      </Command.Dialog>
    </>
  );
}
