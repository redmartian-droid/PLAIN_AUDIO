"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  useContext,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AlignLeft,
  Users,
  Check,
  X,
  AlertTriangle,
  Clock,
  BookOpen,
  RotateCcw,
  FolderOpen,
} from "lucide-react";
import { formatRelativeTime, formatDuration, cn } from "@/lib/utils";
import { Toolbar } from "@/components/dashboard/transcription-detail/Toolbar";
import { Player } from "@/components/dashboard/transcription-detail/Player";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const B = "#D63558";
const fontSyne = {
  fontFamily: "var(--font-syne,'Helvetica Neue',sans-serif)",
} as const;
const fontMono = {
  fontFamily: "var(--font-mono,'Courier New',monospace)",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Segment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface Transcription {
  id: string;
  title: string;
  status: "processing" | "pending" | "repairing" | "completed" | "failed";
  created_at: string;
  duration_seconds?: number;
  word_count?: number;
  language?: string;
  full_text?: string;
  segments?: Segment[];
  clean_text?: string;
  segments_clean?: Segment[];
  audio_storage_path?: string;
  folder_id?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getSpeakerColor(speaker: string): string {
  const colors = [
    "text-[#2563EB]",
    "text-violet-600 dark:text-violet-400",
    "text-teal-600 dark:text-teal-400",
    "text-amber-600 dark:text-amber-400",
    "text-emerald-600 dark:text-emerald-400",
  ];
  return colors[parseInt(speaker.replace(/\D/g, "") || "0") % colors.length];
}

function hasSpeakerDiarization(segments?: Segment[]): boolean {
  const speakers = new Set(
    segments?.filter((s) => s.speaker !== undefined).map((s) => s.speaker),
  );
  return speakers.size >= 2;
}

function getSpeakerCount(segments?: Segment[]): number {
  return new Set(
    segments?.filter((s) => s.speaker !== undefined).map((s) => s.speaker),
  ).size;
}

// ─── Segment Grouping ─────────────────────────────────────────────────────────

interface SegmentGroup {
  speaker?: string;
  segments: Segment[];
}

function groupSegments(segments: Segment[]): SegmentGroup[] {
  if (!segments.length) return [];
  const groups: SegmentGroup[] = [];
  let current: SegmentGroup = {
    speaker: segments[0].speaker,
    segments: [segments[0]],
  };
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const prev = segments[i - 1];
    const gap = seg.start - prev.end;
    const speakerChanged = seg.speaker !== current.speaker;
    const longSilence = !speakerChanged && gap > 2.0;
    if (speakerChanged || longSilence) {
      groups.push(current);
      current = { speaker: seg.speaker, segments: [seg] };
    } else {
      current.segments.push(seg);
    }
  }
  groups.push(current);
  return groups;
}

// ─── Stat Strip ───────────────────────────────────────────────────────────────

function StatStrip({
  duration_seconds,
  word_count,
  language,
  segments,
  created_at,
}: {
  duration_seconds?: number;
  word_count?: number;
  language?: string;
  segments?: Segment[];
  created_at: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const readingMins = word_count ? Math.ceil(word_count / 200) : null;
  const speakerCount = getSpeakerCount(segments);

  const chips: {
    icon?: React.ElementType;
    label: string;
    secondary?: boolean;
  }[] = [
    { icon: Clock, label: formatRelativeTime(created_at) },
    ...(duration_seconds
      ? [{ icon: Clock, label: formatDuration(duration_seconds) }]
      : []),
    ...(word_count
      ? [
          {
            icon: AlignLeft,
            label: `${word_count.toLocaleString()} words`,
            secondary: true,
          },
        ]
      : []),
    ...(readingMins
      ? [{ icon: BookOpen, label: `~${readingMins} min read`, secondary: true }]
      : []),
    ...(language ? [{ label: language.toUpperCase(), secondary: true }] : []),
    ...(speakerCount >= 2
      ? [{ icon: Users, label: `${speakerCount} speakers`, secondary: true }]
      : []),
  ];

  const primary = chips.filter((c) => !c.secondary);
  const secondary = chips.filter((c) => c.secondary);

  return (
    <div className="flex items-center flex-wrap gap-1.5">
      {primary.map((chip, i) => {
        const Icon = chip.icon;
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md"
            style={{
              background: "#F0EEEB",
              ...fontMono,
              fontSize: 10.5,
              color: "#888581",
              letterSpacing: "0.03em",
            }}
          >
            {Icon && <Icon size={10} strokeWidth={2} aria-hidden />}
            {chip.label}
          </span>
        );
      })}

      {secondary.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="md:hidden inline-flex items-center gap-1 px-2 py-[3px] rounded-md transition-colors active:scale-95"
            style={{
              background: "#F0EEEB",
              ...fontMono,
              fontSize: 10.5,
              color: "#888581",
              letterSpacing: "0.03em",
            }}
            aria-label={expanded ? "Show fewer details" : "Show more details"}
          >
            {expanded ? "Less" : `+${secondary.length}`}
          </button>
          {(expanded ||
            (typeof window !== "undefined" && window.innerWidth >= 768)) &&
            secondary.map((chip, i) => {
              const Icon = chip.icon;
              return (
                <span
                  key={`sec-${i}`}
                  className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md"
                  style={{
                    background: "#F0EEEB",
                    ...fontMono,
                    fontSize: 10.5,
                    color: "#888581",
                    letterSpacing: "0.03em",
                  }}
                >
                  {Icon && <Icon size={10} strokeWidth={2} aria-hidden />}
                  {chip.label}
                </span>
              );
            })}
        </>
      )}
    </div>
  );
}

// ─── Status Signal ────────────────────────────────────────────────────────────

function StatusSignal({ status }: { status: string }) {
  const map: Record<string, { dot: string; label: string }> = {
    processing: { dot: "bg-amber-400 animate-pulse", label: "Processing" },
    repairing: { dot: "bg-amber-400 animate-pulse", label: "Repairing" },
    pending: { dot: "bg-slate-400", label: "Pending" },
    failed: { dot: "bg-red-500", label: "Failed" },
  };
  const entry = map[status];
  if (!entry) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.dot}`} />
      <span>{entry.label}</span>
    </span>
  );
}

// ─── Transcript: Inline Timestamp View ───────────────────────────────────────

function InlineTranscript({
  segments,
  showSpeakers,
  activeTime,
  onSeek,
}: {
  segments: Segment[];
  showSpeakers: boolean;
  activeTime: number;
  onSeek: (time: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeSegRef = useRef<HTMLSpanElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = groupSegments(segments);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      setAutoScroll(false);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setAutoScroll(true), 2500);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!autoScroll) return;
    const activeEl = activeSegRef.current;
    const container = containerRef.current;
    if (!activeEl || !container) return;
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const padding = 80;
    const isAbove = activeRect.top < containerRect.top + padding;
    const isBelow = activeRect.bottom > containerRect.bottom - padding;
    if (isAbove || isBelow) {
      activeEl.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeTime, autoScroll]);

  const handleSeek = useCallback(
    (time: number) => {
      setAutoScroll(true);
      onSeek(time);
    },
    [onSeek],
  );

  return (
    <div ref={containerRef} className="space-y-1">
      {groups.map((group, gi) => (
        <div key={gi}>
          {showSpeakers && group.speaker && (
            <p
              className={`text-xs font-semibold uppercase tracking-wide mb-1 mt-4 first:mt-0 ${getSpeakerColor(group.speaker)}`}
            >
              {group.speaker}
            </p>
          )}
          <p className="text-sm md:text-[15px] text-muted-foreground leading-[1.85] max-w-prose">
            {group.segments.map((seg, si) => {
              const isActive = activeTime >= seg.start && activeTime < seg.end;
              return (
                <span key={si} ref={isActive ? activeSegRef : null}>
                  <span className="text-xs font-mono text-muted-foreground/30 mr-1 select-none">
                    ({shortTimestamp(seg.start)})
                  </span>
                  <span
                    onClick={() => handleSeek(seg.start)}
                    className={cn(
                      "cursor-pointer rounded px-1.5 py-0.5 -mx-1.5 transition-colors duration-150",
                      isActive
                        ? "bg-foreground/10 text-foreground"
                        : "hover:bg-muted-foreground/10 active:bg-foreground/5",
                    )}
                  >
                    {seg.text}
                  </span>{" "}
                </span>
              );
            })}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Plain Text Fallback ──────────────────────────────────────────────────────

function PlainTranscript({ text }: { text: string }) {
  return (
    <div className="space-y-4 max-w-prose">
      {text.split("\n").map((p, i) =>
        p.trim() ? (
          <p
            key={i}
            className="text-sm md:text-[15px] text-muted-foreground leading-[1.85]"
          >
            {p}
          </p>
        ) : null,
      )}
    </div>
  );
}

// ─── Processing State ─────────────────────────────────────────────────────────

function ProcessingState({ status }: { status: string }) {
  const msgs: Record<string, string> = {
    processing: "Converting audio to text",
    repairing: "Normalizing speech and fixing errors",
    pending: "Queued — this page updates automatically",
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 py-16">
      <span
        className="inline-flex items-end gap-[3px]"
        aria-hidden
        style={{ height: 28 }}
      >
        {[
          { h: "100%", delay: "0ms", dur: "600ms" },
          { h: "65%", delay: "120ms", dur: "480ms" },
          { h: "40%", delay: "60ms", dur: "700ms" },
          { h: "80%", delay: "200ms", dur: "540ms" },
          { h: "40%", delay: "100ms", dur: "620ms" },
          { h: "55%", delay: "160ms", dur: "560ms" },
          { h: "100%", delay: "40ms", dur: "580ms" },
        ].map((bar, i) => (
          <span
            key={i}
            className="rounded-full block origin-bottom"
            style={{
              width: 3,
              height: bar.h,
              background: B,
              opacity: 0.5,
              animationName: "waveBar",
              animationDuration: bar.dur,
              animationDelay: bar.delay,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDirection: "alternate",
            }}
          />
        ))}
      </span>

      <div className="flex flex-col items-center gap-1 text-center">
        <p
          className="text-[13px] text-foreground"
          style={{ ...fontMono, letterSpacing: "0.03em" }}
        >
          {msgs[status] ?? "Working…"}
        </p>
        <p
          className="text-[11px]"
          style={{ ...fontMono, color: "#AAA8A4", letterSpacing: "0.03em" }}
        >
          Page updates automatically
        </p>
      </div>
    </div>
  );
}

// ─── Failed State ─────────────────────────────────────────────────────────────

function FailedState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 py-16">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "#FEE2E2" }}
      >
        <AlertTriangle size={18} style={{ color: "#DC2626" }} />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-[13px] font-medium text-foreground">
          Transcription failed
        </p>
        <p
          className="text-[11px] max-w-[240px] leading-relaxed"
          style={{ color: "#AAA8A4" }}
        >
          Something went wrong processing this file. You can try again or upload
          a new copy.
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
          style={{
            background: "#F0EEEB",
            color: "#0D0D0D",
            border: "1px solid #E2E0DB",
            ...fontMono,
            letterSpacing: "0.04em",
          }}
        >
          <RotateCcw size={12} />
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <div
        className="fixed inset-0 z-[60] md:hidden"
        style={{
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 320ms ease",
        }}
        onClick={onCancel}
        aria-hidden
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-[60] md:hidden flex flex-col"
        style={{
          background: "#F8F7F4",
          borderRadius: "20px 20px 0 0",
          borderTop: "1px solid #E2E0DB",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 400ms cubic-bezier(0.32,0.72,0,1)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: "#E2E0DB" }}
          />
        </div>

        {/* Content */}
        <div
          className="px-5 pt-2 pb-6"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(10px)",
            transition: open
              ? "opacity 300ms ease 80ms, transform 300ms cubic-bezier(0.32,0.72,0,1) 80ms"
              : "opacity 100ms ease, transform 100ms ease",
          }}
        >
          <div className="flex items-start gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#FEE2E2" }}
            >
              <AlertTriangle size={18} style={{ color: "#DC2626" }} />
            </div>
            <div>
              <h3
                className="text-[15px] font-semibold text-foreground"
                style={{ ...fontSyne }}
              >
                {title}
              </h3>
              <p
                className="text-[13px] leading-relaxed mt-1"
                style={{ color: "#888581" }}
              >
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onCancel();
                onConfirm();
              }}
              className="w-full py-3.5 rounded-xl text-[15px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#DC2626", ...fontMono }}
            >
              Delete
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3.5 rounded-xl text-[15px] font-medium transition-colors hover:bg-[#F0EEEB] active:scale-[0.98]"
              style={{ color: "#6B6966", ...fontMono }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: Centered Modal */}
      <div
        className="hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4"
        style={{
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 200ms ease",
        }}
      >
        <div
          className="w-full max-w-sm rounded-xl overflow-hidden"
          style={{
            background: "#F8F7F4",
            border: "1px solid #E2E0DB",
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
            transform: open ? "scale(1)" : "scale(0.96)",
            opacity: open ? 1 : 0,
            transition:
              "transform 200ms cubic-bezier(0.32,0.72,0,1), opacity 200ms ease",
          }}
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#FEE2E2" }}
            >
              <AlertTriangle size={16} style={{ color: "#DC2626" }} />
            </div>
            <div className="pt-0.5">
              <h3
                className="text-[14px] font-semibold text-foreground leading-snug"
                style={{ ...fontSyne }}
              >
                {title}
              </h3>
              <p
                className="text-[12px] leading-relaxed mt-1"
                style={{ color: "#888581" }}
              >
                {description}
              </p>
            </div>
          </div>

          <div
            className="flex items-center justify-end gap-2 px-5 py-3"
            style={{ background: "#F0EEEB", borderTop: "1px solid #E2E0DB" }}
          >
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors hover:bg-[#E8E5E1] active:scale-[.97]"
              style={{ color: "#6B6966", ...fontMono, letterSpacing: "0.04em" }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-colors hover:bg-red-700 active:scale-[.97]"
              style={{
                background: "#DC2626",
                ...fontMono,
                letterSpacing: "0.04em",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Move Dialog ──────────────────────────────────────────────────────────────

function MoveDialog({
  open,
  currentFolderId,
  onClose,
  onMove,
}: {
  open: boolean;
  currentFolderId?: string;
  onClose: () => void;
  onMove: (folderId: string) => void;
}) {
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("folders")
      .select("id, name")
      .order("name")
      .then(({ data }) => setFolders(data || []));
  }, [open]);

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <div
        className="fixed inset-0 z-[60] md:hidden"
        style={{
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 320ms ease",
        }}
        onClick={onClose}
        aria-hidden
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-[60] md:hidden flex flex-col max-h-[70vh]"
        style={{
          background: "#F8F7F4",
          borderRadius: "20px 20px 0 0",
          borderTop: "1px solid #E2E0DB",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 400ms cubic-bezier(0.32,0.72,0,1)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: "#E2E0DB" }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-2 pb-3"
          style={{ borderBottom: "1px solid #E2E0DB" }}
        >
          <h3
            className="text-[15px] font-semibold text-foreground"
            style={fontSyne}
          >
            Move to folder
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#E8E5E1] text-muted-foreground"
          >
            <X size={14} />
          </button>
        </div>

        {/* Folder list */}
        <div className="overflow-y-auto p-2">
          {folders.length === 0 && (
            <p
              className="text-[13px] text-center py-8"
              style={{ color: "#AAA8A4", ...fontMono }}
            >
              No folders yet.
            </p>
          )}
          {folders.map((folder, i) => {
            const isCurrent = folder.id === currentFolderId;
            return (
              <button
                key={folder.id}
                onClick={() => onMove(folder.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors active:scale-[0.98]",
                  isCurrent ? "bg-[#F0EEEB] font-medium" : "hover:bg-[#F0EEEB]",
                )}
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(10px)",
                  transition: open
                    ? `opacity 300ms ease ${80 + i * 55}ms, transform 300ms cubic-bezier(0.32,0.72,0,1) ${80 + i * 55}ms`
                    : "opacity 100ms ease, transform 100ms ease",
                }}
              >
                <FolderOpen
                  size={16}
                  aria-hidden
                  style={{ color: isCurrent ? B : undefined }}
                  className={isCurrent ? undefined : "text-muted-foreground/50"}
                />
                <span className="flex-1 truncate text-[15px]">
                  {folder.name}
                </span>
                {isCurrent && (
                  <Check size={14} style={{ color: B }} aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Centered Modal */}
      <div
        className="hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4"
        style={{
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 200ms ease",
        }}
      >
        <div
          className="w-full max-w-sm rounded-xl overflow-hidden"
          style={{
            background: "#F8F7F4",
            border: "1px solid #E2E0DB",
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
            transform: open ? "scale(1)" : "scale(0.96)",
            opacity: open ? 1 : 0,
            transition:
              "transform 200ms cubic-bezier(0.32,0.72,0,1), opacity 200ms ease",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #E2E0DB" }}
          >
            <h3
              className="text-[13px] font-semibold text-foreground"
              style={fontSyne}
            >
              Move to folder
            </h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#E8E5E1] text-muted-foreground"
            >
              <X size={13} />
            </button>
          </div>

          <div className="p-2 max-h-64 overflow-y-auto">
            {folders.length === 0 && (
              <p
                className="text-[12px] text-center py-6"
                style={{ color: "#AAA8A4", ...fontMono }}
              >
                No folders yet.
              </p>
            )}
            {folders.map((folder) => {
              const isCurrent = folder.id === currentFolderId;
              return (
                <button
                  key={folder.id}
                  onClick={() => onMove(folder.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-colors",
                    isCurrent
                      ? "bg-[#F0EEEB] font-medium"
                      : "hover:bg-[#F0EEEB]",
                  )}
                >
                  <FolderOpen
                    size={13}
                    aria-hidden
                    style={{ color: isCurrent ? B : undefined }}
                    className={
                      isCurrent ? undefined : "text-muted-foreground/50"
                    }
                  />
                  <span className="flex-1 truncate">{folder.name}</span>
                  {isCurrent && (
                    <Check size={12} style={{ color: B }} aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TranscriptionDetail({
  transcription: initial,
}: {
  transcription: Transcription;
}) {
  const [transcription, setTranscription] = useState<Transcription>(initial);
  const [speakerView, setSpeakerView] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const seekRef = useRef<((time: number) => void) | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(transcription.title);
  const [isEditingText, setIsEditingText] = useState(false);
  const [textDraft, setTextDraft] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  useEffect(() => {
    setTitleDraft(transcription.title);
  }, [transcription.title]);

  useEffect(() => {
    setTextDraft(transcription.clean_text || transcription.full_text || "");
  }, [transcription.clean_text, transcription.full_text]);

  const audioUrl = useMemo(() => {
    if (!transcription.audio_storage_path) return null;
    const supabase = createClient();
    const { data } = supabase.storage
      .from("audio-uploads")
      .getPublicUrl(transcription.audio_storage_path);
    return data.publicUrl;
  }, [transcription.audio_storage_path]);

  const handleSeek = useCallback((time: number) => {
    seekRef.current?.(time);
  }, []);

  // Realtime updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`transcription:${transcription.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transcriptions",
          filter: `id=eq.${transcription.id}`,
        },
        (payload) => {
          setTranscription((prev) => ({
            ...prev,
            ...(payload.new as Partial<Transcription>),
          }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [transcription.id]);

  const handleDownloadAudio = useCallback(() => {
    if (!audioUrl) return;
    const ext = audioUrl.split(".").pop()?.split("?")[0] || "mp3";
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${transcription.title}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [audioUrl, transcription.title]);

  const handleRename = useCallback(async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === transcription.title) {
      setTitleDraft(transcription.title);
      setIsEditingTitle(false);
      return;
    }
    const supabase = createClient();
    await supabase
      .from("transcriptions")
      .update({ title: trimmed })
      .eq("id", transcription.id);
    setTranscription((prev) => ({ ...prev, title: trimmed }));
    setIsEditingTitle(false);
  }, [titleDraft, transcription.title, transcription.id]);

  const handleSaveText = useCallback(async () => {
    const supabase = createClient();
    const field =
      transcription.clean_text !== undefined ? "clean_text" : "full_text";
    const { error } = await supabase
      .from("transcriptions")
      .update({ [field]: textDraft })
      .eq("id", transcription.id);
    if (!error) {
      setTranscription((prev) => ({ ...prev, [field]: textDraft }));
      setIsEditingText(false);
    }
  }, [textDraft, transcription.clean_text, transcription.id]);

  const handleDelete = useCallback(async () => {
    const supabase = createClient();
    if (transcription.audio_storage_path) {
      await supabase.storage
        .from("audio-uploads")
        .remove([transcription.audio_storage_path]);
    }
    await supabase.from("transcriptions").delete().eq("id", transcription.id);
    window.location.href = "/dashboard";
  }, [transcription]);

  const handleMove = useCallback(
    async (folderId: string) => {
      const supabase = createClient();
      await supabase
        .from("transcriptions")
        .update({ folder_id: folderId })
        .eq("id", transcription.id);
      setTranscription((prev) => ({ ...prev, folder_id: folderId }));
      setShowMoveDialog(false);
    },
    [transcription.id],
  );

  const {
    title,
    status,
    created_at,
    duration_seconds,
    word_count,
    language,
    full_text,
    segments,
    clean_text,
    segments_clean,
  } = transcription;

  const activeText = clean_text || full_text || "";
  const activeSegments = segments_clean || segments || undefined;

  const hasSpeakers = hasSpeakerDiarization(activeSegments);
  const hasSegments = !!activeSegments?.length;

  const isTranscribing = ["processing", "pending", "repairing"].includes(
    status,
  );
  const isFailed = status === "failed";
  const showResults = status === "completed";

  return (
    <div className="flex flex-col h-full px-6 md:px-8 py-8 max-w-5xl mx-auto w-full overflow-hidden">
      {/* ── Title row ── */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-shrink-0">
        <div className="space-y-1 min-w-0 flex-1">
          {isEditingTitle ? (
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setTitleDraft(title);
                  setIsEditingTitle(false);
                }
              }}
              onBlur={handleRename}
              autoFocus
              className="bg-transparent outline-none px-0 py-0.5 w-full max-w-xl"
              style={{
                ...fontSyne,
                fontWeight: 800,
                fontSize: "clamp(1.3rem, 2.5vw, 1.6rem)",
                letterSpacing: "-0.035em",
                borderBottom: `1px solid ${B}`,
                color: "#0D0D0D",
              }}
            />
          ) : (
            <h1
              className="cursor-pointer hover:opacity-70 transition-opacity leading-snug"
              onClick={() => setIsEditingTitle(true)}
              title="Click to rename"
              style={{
                ...fontSyne,
                fontWeight: 800,
                fontSize: "clamp(1.3rem, 2.5vw, 1.6rem)",
                letterSpacing: "-0.035em",
                color: "#0D0D0D",
              }}
            >
              {title}
            </h1>
          )}

          {/* Status for non-completed */}
          {!showResults && (
            <div
              style={{
                ...fontMono,
                fontSize: 10.5,
                letterSpacing: "0.04em",
                color: "#AAA8A4",
              }}
            >
              <StatusSignal status={status} />
            </div>
          )}
        </div>

        {/* Toolbar — responsive grouping */}
        {showResults && (
          <Toolbar
            onEditText={() => setIsEditingText(true)}
            onRename={() => setIsEditingTitle(true)}
            onDownload={handleDownloadAudio}
            canDownload={!!audioUrl}
            onMoveToFolder={() => setShowMoveDialog(true)}
            onDelete={() => setShowDeleteDialog(true)}
            showMobileActions={showMobileActions}
            onMobileActionsChange={setShowMobileActions}
            transcription={{
              id: transcription.id,
              title,
              full_text: activeText,
              segments: activeSegments ?? null,
            }}
          />
        )}
      </div>

      {/* ── Stat strip — only when completed ── */}
      {showResults && (
        <div className="mb-5 flex-shrink-0">
          <StatStrip
            duration_seconds={duration_seconds}
            word_count={word_count}
            language={language}
            segments={activeSegments}
            created_at={created_at}
          />
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 min-h-0">
        {isTranscribing && <ProcessingState status={status} />}
        {isFailed && <FailedState />}

        {showResults && (
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {/* Speaker toggle */}
            {hasSpeakers && !isEditingText && (
              <div
                className="flex items-center gap-1 rounded-lg p-1 w-fit flex-shrink-0"
                style={{ background: "#F0EEEB" }}
              >
                {[
                  {
                    id: "full",
                    label: "Full text",
                    icon: AlignLeft,
                    active: !speakerView,
                  },
                  {
                    id: "speaker",
                    label: "By speaker",
                    icon: Users,
                    active: speakerView,
                  },
                ].map(({ id, label, icon: Icon, active }) => (
                  <button
                    key={id}
                    onClick={() => setSpeakerView(id === "speaker")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-150",
                      active
                        ? "bg-white text-[#0D0D0D] shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    style={{
                      ...fontMono,
                      fontSize: 11,
                      letterSpacing: "0.04em",
                    }}
                  >
                    <Icon size={12} aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Transcript area */}
            <div className="relative flex-1 min-h-0">
              {/* Top fade */}
              <div
                className="absolute top-0 inset-x-0 h-20 z-10 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
                }}
              />

              <div className="h-full overflow-y-auto py-6 pr-2">
                {isEditingText ? (
                  <div className="h-full flex flex-col max-w-prose">
                    <textarea
                      value={textDraft}
                      onChange={(e) => setTextDraft(e.target.value)}
                      className="flex-1 min-h-[200px] w-full resize-none rounded-xl p-4 text-sm text-foreground leading-[1.85] outline-none transition-colors"
                      style={{
                        background: "#F0EEEB",
                        border: "1px solid #E2E0DB",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = B)}
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "#E2E0DB")
                      }
                    />
                    <div className="flex items-center justify-end gap-2 mt-4 flex-shrink-0">
                      <button
                        onClick={() => {
                          setTextDraft(activeText);
                          setIsEditingText(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors hover:bg-[#F0EEEB]"
                        style={{
                          color: "#6B6966",
                          ...fontMono,
                          letterSpacing: "0.04em",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveText}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-opacity hover:opacity-80 active:scale-[.97]"
                        style={{
                          background: "#0D0D0D",
                          ...fontMono,
                          letterSpacing: "0.04em",
                        }}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                ) : hasSegments ? (
                  <InlineTranscript
                    segments={activeSegments!}
                    showSpeakers={speakerView && hasSpeakers}
                    activeTime={audioTime}
                    onSeek={handleSeek}
                  />
                ) : activeText ? (
                  <PlainTranscript text={activeText} />
                ) : (
                  <p className="text-sm text-muted-foreground py-8">
                    Transcription completed but no text was returned.
                  </p>
                )}
              </div>

              {/* Bottom fade */}
              <div
                className="absolute bottom-0 inset-x-0 h-20 z-10 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, var(--background) 0%, transparent 100%)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Audio Player ── */}
      <Player
        src={audioUrl}
        onTimeUpdate={setAudioTime}
        seekRef={seekRef}
        visible={showResults && !showMobileActions}
      />

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete transcription"
        description="This permanently deletes the transcript and its audio file. This action cannot be undone."
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          setShowDeleteDialog(false);
          handleDelete();
        }}
      />

      <MoveDialog
        open={showMoveDialog}
        currentFolderId={transcription.folder_id}
        onClose={() => setShowMoveDialog(false)}
        onMove={handleMove}
      />
    </div>
  );
}
