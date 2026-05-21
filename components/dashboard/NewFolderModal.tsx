"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NewFolderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (folder: { id: string; name: string }) => void;
}

function useFocusTrap(
  ref: React.RefObject<HTMLDivElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const getFocusable = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = getFocusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [active, ref]);
}

export function NewFolderModal({
  open,
  onClose,
  onSuccess,
}: NewFolderModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setName("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!mounted) return null;

  async function handleSubmit() {
    if (!name.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onSuccess ? onSuccess(data) : router.refresh();
      onClose();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-modal-title"
      style={{
        background: open ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        transition: "background 200ms ease",
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={cn(
          // Layout
          "w-full max-w-[360px] px-5 py-5",
          // Surface — matches bg-card + hairline border from TranscriptionRow
          "bg-card border border-border/[0.08]",
          "rounded-xl",
          "shadow-[0_8px_40px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)]",
          // Entry/exit spring — same easing family as row transitions
          "motion-safe:transition-[opacity,transform]",
          "motion-safe:duration-[220ms]",
          "motion-safe:[transition-timing-function:cubic-bezier(0.34,1.2,0.64,1)]",
          open
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-[0.98]",
        )}
      >
        {/* Left-aligned title — Linear never centres dialog headings */}
        <h2
          id="folder-modal-title"
          className="text-[14px] font-medium tracking-tight text-foreground mb-4"
        >
          New folder
        </h2>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          // "Untitled" over "Folder name" — Linear idiom; less instructional
          placeholder="Untitled"
          value={name}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          maxLength={80}
          aria-describedby={error ? "folder-name-error" : undefined}
          aria-invalid={!!error}
          className={cn(
            "w-full h-[38px] px-3",
            "rounded-lg border",
            "text-[13px] font-medium text-foreground",
            "placeholder:text-muted-foreground/38 placeholder:font-normal",
            "bg-accent/[0.28]",
            "outline-none",
            "transition-[border-color] duration-150",
            error
              ? "border-red-500/30 bg-red-500/[0.04]"
              : "border-border/[0.08] focus:border-border/30",
          )}
        />

        {error && (
          <p
            id="folder-name-error"
            role="alert"
            className="mt-1.5 text-[11px] text-red-500/75"
          >
            {error}
          </p>
        )}

        {/* Actions — right-aligned row, both h-8 for consistent rhythm */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className={cn(
              "h-8 px-3 rounded-lg",
              "text-[13px] font-medium text-muted-foreground/55",
              "hover:text-muted-foreground hover:bg-accent/[0.50]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border/40",
            )}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className={cn(
              "h-8 px-3 rounded-lg",
              // Monochromatic primary — foreground on background inverse
              "bg-foreground text-background",
              "text-[13px] font-medium",
              "transition-all duration-150",
              "hover:opacity-85 active:scale-[0.98]",
              // 40% disabled — readable as inactive, not broken
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-foreground/40",
            )}
          >
            {loading ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
