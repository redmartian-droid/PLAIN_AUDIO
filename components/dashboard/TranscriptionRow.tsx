"use client";

import Link from "next/link";
import { FileAudio, Loader2, Clock, XCircle, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import { useRef, useState, useCallback } from "react";
import type { ReactNode, KeyboardEvent, MouseEvent, PointerEvent } from "react";

export type TranscriptionRowData = {
  id: string;
  title: string;
  created_at: string;
  status: string;
  duration_seconds?: number;
  word_count?: number;
  language?: string;
};

interface TranscriptionRowProps {
  transcription: TranscriptionRowData;
  selected?: boolean;
  selectionMode?: boolean;
  onSelect?: (e?: MouseEvent | KeyboardEvent | PointerEvent) => void;
  showLanguage?: boolean;
  children?: ReactNode;
}

const LONG_PRESS_DURATION = 500;

export function TranscriptionRow({
  transcription: t,
  selected,
  selectionMode,
  onSelect,
  showLanguage,
  children,
}: TranscriptionRowProps) {
  const selectable = !!onSelect;
  const [isPressing, setIsPressing] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextClickRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const handlePointerDown = (e: PointerEvent) => {
    if (!selectable) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    suppressNextClickRef.current = false;
    setIsPressing(true);

    longPressTimerRef.current = setTimeout(() => {
      suppressNextClickRef.current = true;
      setIsPressing(false);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
      onSelect?.(e);
    }, LONG_PRESS_DURATION);
  };

  const handlePointerUp = () => clearLongPress();
  const handlePointerLeave = () => {
    clearLongPress();
    suppressNextClickRef.current = false;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (selectable || selectionMode) e.preventDefault();
  };

  const handleSelectKey = (e: KeyboardEvent) => {
    if (!selectable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(e);
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      onContextMenu={handleContextMenu}
      className={cn(
        "group flex flex-row items-stretch rounded-lg bg-card",
        "min-h-[60px] sm:min-h-0",
        "border border-[#E2E0DB]",
        "transition-[background-color,border-color,transform] duration-150 ease-out",
        "active:bg-[#F0EEEB]/80 active:duration-75",
        "hover:bg-[#F0EEEB]/50 hover:border-[#D8D6D1]",
        "focus-within:bg-[#F0EEEB]/40 focus-within:border-[#D8D6D1]",
        isPressing && "scale-[0.985] bg-[#EBE9E4] border-[#D8D6D1]",
        selected && [
          "bg-[#F0EEEB]",
          "border-[#D8D6D1]",
          "shadow-[0_0_0_1px_#D8D6D1]",
        ],
        "select-none touch-manipulation",
      )}
    >
      {/* ── Selection anchor ─────────────────────────────────────────── */}
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
            "shrink-0 self-stretch flex items-center justify-center",
            "w-11 sm:w-10",
            !selectionMode && "hidden",
            "sm:flex",
            "transition-all duration-150 ease-out",
            selectionMode
              ? "opacity-100 translate-x-0"
              : "sm:opacity-0 sm:-translate-x-1 sm:group-hover:opacity-100 sm:group-hover:translate-x-0",
          )}
        >
          <Checkbox checked={!!selected} />
        </button>
      )}

      {/* ── Main surface ─────────────────────────────────────────────── */}
      <Link
        href={`/dashboard/transcriptions/${t.id}`}
        onClick={(e) => {
          if (suppressNextClickRef.current) {
            e.preventDefault();
            suppressNextClickRef.current = false;
            return;
          }
          if (selectionMode) {
            e.preventDefault();
            onSelect?.(e);
          }
        }}
        className={cn(
          "flex flex-1 items-center gap-3 sm:gap-5 min-w-0",
          "py-3 pr-4 sm:pr-5",
          !selectable
            ? "pl-4 sm:pl-5"
            : selectionMode
              ? "pl-0"
              : "pl-4 sm:pl-0",
          "focus-visible:outline-none",
        )}
      >
        {/* Icon — desktop only */}
        <div className="hidden sm:flex w-10 h-10 shrink-0 items-center justify-center">
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

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-[14px] font-medium tracking-tight text-foreground leading-snug">
            {children ?? t.title}
          </p>

          {/* Mobile metadata */}
          <div
            className="flex sm:hidden items-center gap-2 mt-1 text-[11px] text-muted-foreground/50"
            style={{ fontFamily: "var(--font-mono,'Courier New',monospace)" }}
          >
            <span>{formatRelativeTime(t.created_at)}</span>
            {t.duration_seconds ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatDuration(t.duration_seconds)}</span>
              </>
            ) : null}
            {t.status !== "completed" && (
              <span className="ml-auto">
                <StatusBadge status={t.status} />
              </span>
            )}
          </div>
        </div>

        {/* Desktop metadata */}
        <div className="hidden sm:flex items-center gap-4 shrink-0 self-center">
          <div
            className={cn(
              "flex items-center gap-2",
              "text-[11px] tabular-nums",
              "text-muted-foreground/40",
              "transition-colors duration-150",
              "group-hover:text-muted-foreground/65",
            )}
            style={{ fontFamily: "var(--font-mono,'Courier New',monospace)" }}
          >
            <span>{formatRelativeTime(t.created_at)}</span>

            {t.duration_seconds ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatDuration(t.duration_seconds)}</span>
              </>
            ) : null}

            {t.word_count ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{t.word_count.toLocaleString()} words</span>
              </>
            ) : null}

            {showLanguage && t.language ? (
              <>
                <span aria-hidden="true">·</span>
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
        "text-[11px] font-medium font-mono",
        "transition-colors duration-150",
        config.className,
      )}
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
