"use client";

import Link from "next/link";
import { FileAudio, Loader2, Clock, XCircle, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import type { ReactNode, KeyboardEvent, MouseEvent } from "react";

export type TranscriptionRowData = {
  id: string;
  title: string;
  created_at: string;
  status: string;
  duration_seconds?: number;
  word_count?: number;
  language?: string;
  preview?: string;
};

interface TranscriptionRowProps {
  transcription: TranscriptionRowData;
  selected?: boolean;
  selectionMode?: boolean;
  onSelect?: (e?: MouseEvent | KeyboardEvent) => void;
  showLanguage?: boolean;
  children?: ReactNode;
}

export function TranscriptionRow({
  transcription: t,
  selected,
  selectionMode,
  onSelect,
  showLanguage,
  children,
}: TranscriptionRowProps) {
  const selectable = !!onSelect;

  const handleSelectKey = (e: KeyboardEvent) => {
    if (!selectable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(e);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-stretch rounded-lg bg-card",
        // Committed warm border — same token as sidebar, no ambiguity
        "border border-[#E2E0DB]",
        "transition-[transform,background-color,border-color] duration-200 ease-out",
        "active:scale-[0.991] active:duration-75",
        "hover:bg-[#F0EEEB]/50 hover:border-[#D8D6D1]",
        "focus-within:bg-[#F0EEEB]/40 focus-within:border-[#D8D6D1]",
        selected && [
          "bg-[#F0EEEB]",
          "border-[#D8D6D1]",
          "shadow-[0_0_0_1px_#D8D6D1]",
        ],
      )}
    >
      {/* Selection anchor */}
      {selectable && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect?.(e);
          }}
          onKeyDown={handleSelectKey}
          aria-pressed={selected}
          aria-label={selected ? "Deselect" : "Select"}
          className={cn(
            "w-10 shrink-0 flex items-center justify-center",
            "transition-all duration-150 ease-out",
            "focus-visible:opacity-100 focus-visible:bg-[#F0EEEB]",
            selectionMode
              ? "opacity-100 translate-x-0"
              : [
                  "opacity-0 -translate-x-1",
                  "group-hover:opacity-100 group-hover:translate-x-0",
                ],
          )}
        >
          <Checkbox checked={!!selected} />
        </button>
      )}

      {/* Main surface */}
      <Link
        href={`/dashboard/transcriptions/${t.id}`}
        onClick={(e) => {
          if (selectionMode) {
            e.preventDefault();
            onSelect?.(e);
          }
        }}
        className={cn(
          "flex flex-1 items-center gap-5 min-w-0",
          "py-3 pr-5",
          selectable ? "pl-0" : "pl-5",
          "focus-visible:outline-none",
        )}
      >
        {/* Icon */}
        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
          <FileAudio
            size={16}
            className={cn(
              "transition-colors duration-150",
              selected
                ? "text-foreground/75"
                : "text-muted-foreground/40 group-hover:text-muted-foreground/70",
            )}
            aria-hidden="true"
          />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0 self-center">
          <p className="truncate text-[14px] font-medium tracking-tight text-foreground">
            {children ?? t.title}
          </p>
        </div>

        {/* Metadata + status */}
        <div className="flex items-center gap-4 shrink-0 self-center">
          <div
            className={cn(
              "hidden sm:flex items-center gap-2",
              "text-[12px] tabular-nums",
              "text-muted-foreground/40",
              "transition-colors duration-150",
              "group-hover:text-muted-foreground/65",
            )}
            style={{ fontFamily: "var(--font-mono,'Courier New',monospace)" }}
          >
            <span>{formatRelativeTime(t.created_at)}</span>

            {t.duration_seconds ? (
              <>
                <span>·</span>
                <span>{formatDuration(t.duration_seconds)}</span>
              </>
            ) : null}

            {t.word_count ? (
              <>
                <span>·</span>
                <span>{t.word_count.toLocaleString()} words</span>
              </>
            ) : null}

            {showLanguage && t.language ? (
              <>
                <span>·</span>
                <span>{t.language.toUpperCase()}</span>
              </>
            ) : null}
          </div>

          {t.status !== "completed" && <StatusBadge status={t.status} />}
        </div>
      </Link>
    </div>
  );
}

/* ─── Status badge ─── */

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: ReactNode; className: string; ariaLabel: string }
> = {
  processing: {
    label: "Processing",
    icon: <Loader2 size={10} className="animate-spin" />,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    ariaLabel: "Processing",
  },
  pending: {
    label: "Pending",
    icon: <Clock size={10} />,
    className: "bg-[#F0EEEB] text-[#888581] border-[#E2E0DB]",
    ariaLabel: "Pending",
  },
  failed: {
    label: "Failed",
    icon: <XCircle size={10} />,
    className: "bg-red-50 text-red-700 border-red-200",
    ariaLabel: "Failed",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <span
      aria-label={config.ariaLabel}
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-2 py-[3px]",
        "rounded-full border",
        "shrink-0",
        "text-[11px] font-medium",
        "transition-colors duration-150",
        config.className,
      )}
      style={{ fontFamily: "var(--font-mono,'Courier New',monospace)" }}
    >
      <span className="opacity-75">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

/* ─── Checkbox ─── */

export function Checkbox({
  checked,
  indeterminate,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-4 h-4 rounded-[4px]",
        "border-[1.5px]",
        "flex items-center justify-center",
        "transition-all duration-150 ease-out",
        checked || indeterminate
          ? ["bg-black border-black", "shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"]
          : [
              "bg-transparent",
              "border-[#D8D6D1]",
              "group-hover:border-black/60",
            ],
      )}
      aria-hidden="true"
    >
      {indeterminate ? (
        <Minus size={10} className="text-white" strokeWidth={2.5} />
      ) : checked ? (
        <Check size={10} className="text-white" strokeWidth={2.5} />
      ) : null}
    </div>
  );
}
