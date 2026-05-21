"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AlignLeft,
  Users,
  Play,
  Pause,
  Pencil,
  Download,
  Trash2,
  FolderOpen,
  FileText,
  Check,
  X,
  AlertTriangle,
  Clock,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { formatRelativeTime, formatDuration, cn } from "@/lib/utils";
import { ExportButtons } from "@/components/dashboard/ExportButtons";

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
  const readingMins = word_count ? Math.ceil(word_count / 200) : null;
  const speakerCount = getSpeakerCount(segments);

  const chips: { icon?: React.ElementType; label: string }[] = [
    { icon: Clock, label: formatRelativeTime(created_at) },
    ...(duration_seconds
      ? [{ icon: Clock, label: formatDuration(duration_seconds) }]
      : []),
    ...(word_count
      ? [{ icon: AlignLeft, label: `${word_count.toLocaleString()} words` }]
      : []),
    ...(readingMins
      ? [{ icon: BookOpen, label: `~${readingMins} min read` }]
      : []),
    ...(language ? [{ label: language.toUpperCase() }] : []),
    ...(speakerCount >= 2
      ? [{ icon: Users, label: `${speakerCount} speakers` }]
      : []),
  ];

  return (
    <div className="flex items-center flex-wrap gap-1.5">
      {chips.map((chip, i) => {
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

// ─── Toolbar Divider ──────────────────────────────────────────────────────────

function ToolbarDivider() {
  return (
    <span
      className="w-px h-4 rounded-full flex-shrink-0"
      style={{ background: "#E2E0DB" }}
      aria-hidden
    />
  );
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  disabled,
  label,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg border text-muted-foreground/60",
        "[transition:background-color_150ms_ease,transform_200ms_cubic-bezier(.34,1.56,.64,1),border-color_150ms_ease,color_150ms_ease]",
        "active:scale-90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        danger
          ? [
              "border-border/40",
              "hover:bg-red-50 hover:text-red-600 hover:border-red-200",
              "focus-visible:ring-red-300",
            ]
          : [
              "border-border/40",
              "hover:bg-[#F0EEEB] hover:text-foreground hover:border-[#E2E0DB]",
              "focus-visible:ring-[#D63558]/40",
            ],
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

// ─── Floating Audio Player ────────────────────────────────────────────────────

const BAR_COUNT = 80;
const BAR_W = 2;
const BAR_GAP = 1.5;
const BAR_TOTAL_W = BAR_COUNT * (BAR_W + BAR_GAP);
const WAVEFORM_H = 40;

function buildFakeWaveform(): number[] {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const t = i / BAR_COUNT;
    return Math.max(
      0.08,
      0.5 +
        0.35 * Math.sin(t * Math.PI * 7) +
        0.15 * Math.sin(t * Math.PI * 19 + 1) +
        0.1 * Math.sin(t * Math.PI * 41 + 2),
    );
  });
}

function AudioPlayer({
  src,
  onTimeUpdate,
  seekRef,
}: {
  src: string;
  onTimeUpdate: (time: number) => void;
  seekRef: React.MutableRefObject<((time: number) => void) | null>;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(buildFakeWaveform);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    async function decode() {
      try {
        const res = await fetch(src);
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const ctx = new AudioContext();
        const audioBuf = await ctx.decodeAudioData(buf);
        if (cancelled) return;
        const data = audioBuf.getChannelData(0);
        const blockSize = Math.floor(data.length / BAR_COUNT);
        const bars: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let peak = 0;
          const start = i * blockSize;
          for (let j = 0; j < blockSize; j++) {
            peak = Math.max(peak, Math.abs(data[start + j]));
          }
          bars.push(peak);
        }
        const max = Math.max(...bars, 0.001);
        setWaveform(bars.map((v) => Math.max(0.06, v / max)));
        await ctx.close();
      } catch {
        // keep shaped fake waveform
      }
    }
    decode();
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    seekRef.current = (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      if (!isPlaying) audio.play().catch(() => {});
    };
  }, [seekRef, isPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});
  }, [isPlaying]);

  const handleWaveformClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = Math.max(0, Math.min(1, ratio)) * duration;
    },
    [duration],
  );

  const progress = duration > 0 ? currentTime / duration : 0;
  const playheadX = progress * BAR_TOTAL_W;

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-2xl border"
      style={{
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "#E2E0DB",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setCurrentTime(t);
          onTimeUpdate(t);
        }}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          onTimeUpdate(0);
        }}
      />

      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
        style={{ background: B, color: "#fff" }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause size={14} strokeWidth={2.5} />
        ) : (
          <Play size={14} strokeWidth={2.5} className="translate-x-px" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <svg
          viewBox={`0 0 ${BAR_TOTAL_W} ${WAVEFORM_H}`}
          preserveAspectRatio="none"
          className="w-full cursor-pointer"
          style={{ height: WAVEFORM_H }}
          onClick={handleWaveformClick}
          aria-label="Seek audio"
        >
          <defs>
            <clipPath id="cp-played-player">
              <rect x={0} y={0} width={playheadX} height={WAVEFORM_H} />
            </clipPath>
            <clipPath id="cp-unplayed-player">
              <rect
                x={playheadX}
                y={0}
                width={BAR_TOTAL_W}
                height={WAVEFORM_H}
              />
            </clipPath>
          </defs>

          {/* Unplayed */}
          <g clipPath="url(#cp-unplayed-player)" style={{ opacity: 0.15 }}>
            {waveform.map((amp, i) => {
              const x = i * (BAR_W + BAR_GAP);
              const barH = Math.max(2, amp * (WAVEFORM_H - 4));
              return (
                <rect
                  key={`u-${i}`}
                  x={x}
                  y={(WAVEFORM_H - barH) / 2}
                  width={BAR_W}
                  height={barH}
                  rx={BAR_W / 2}
                  fill="currentColor"
                />
              );
            })}
          </g>

          {/* Played — brand red */}
          <g clipPath="url(#cp-played-player)">
            {waveform.map((amp, i) => {
              const x = i * (BAR_W + BAR_GAP);
              const barH = Math.max(2, amp * (WAVEFORM_H - 4));
              return (
                <rect
                  key={`p-${i}`}
                  x={x}
                  y={(WAVEFORM_H - barH) / 2}
                  width={BAR_W}
                  height={barH}
                  rx={BAR_W / 2}
                  fill={B}
                />
              );
            })}
          </g>

          {/* Playhead */}
          {duration > 0 && (
            <rect
              x={playheadX - 0.75}
              y={0}
              width={1.5}
              height={WAVEFORM_H}
              rx={0.75}
              fill={B}
              opacity={0.7}
            />
          )}
        </svg>
      </div>

      <span
        className="flex-shrink-0 tabular-nums"
        style={{ ...fontMono, fontSize: 11, color: "#AAA8A4" }}
      >
        {shortTimestamp(currentTime)}
        <span className="opacity-40 mx-0.5">/</span>
        {shortTimestamp(duration)}
      </span>
    </div>
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
          <p className="text-sm text-muted-foreground leading-[1.85] max-w-prose">
            {group.segments.map((seg, si) => {
              const isActive = activeTime >= seg.start && activeTime < seg.end;
              return (
                <span key={si} ref={isActive ? activeSegRef : null}>
                  <span className="text-[11px] font-mono text-muted-foreground/30 mr-1 select-none">
                    ({shortTimestamp(seg.start)})
                  </span>
                  <span
                    onClick={() => handleSeek(seg.start)}
                    className={`cursor-pointer rounded px-0.5 -mx-0.5 transition-colors duration-150 ${
                      isActive
                        ? "bg-foreground/10 text-foreground"
                        : "hover:bg-muted-foreground/10"
                    }`}
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
          <p key={i} className="text-sm text-muted-foreground leading-[1.85]">
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
      {/* Animated bars — mirrors the logo waveform */}
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
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl overflow-hidden"
        style={{
          background: "#F8F7F4",
          border: "1px solid #E2E0DB",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
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

        {/* Actions */}
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl overflow-hidden"
        style={{
          background: "#F8F7F4",
          border: "1px solid #E2E0DB",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
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

        {/* Folder list */}
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
                  isCurrent ? "bg-[#F0EEEB] font-medium" : "hover:bg-[#F0EEEB]",
                )}
              >
                <FolderOpen
                  size={13}
                  aria-hidden
                  style={{ color: isCurrent ? B : undefined }}
                  className={isCurrent ? undefined : "text-muted-foreground/50"}
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

        {/* Toolbar — grouped with dividers */}
        {showResults && (
          <div className="flex-shrink-0 flex items-center gap-2 pt-0.5">
            <div className="flex items-center gap-1">
              {/* Group 1: content edits */}
              <ToolbarBtn
                onClick={() => setIsEditingText(true)}
                label="Edit transcript"
              >
                <FileText size={13} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => setIsEditingTitle(true)}
                label="Rename"
              >
                <Pencil size={13} />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Group 2: file */}
              <ToolbarBtn
                onClick={handleDownloadAudio}
                disabled={!audioUrl}
                label="Download audio"
              >
                <Download size={13} />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Group 3: organisation */}
              <ToolbarBtn
                onClick={() => setShowMoveDialog(true)}
                label="Move to folder"
              >
                <FolderOpen size={13} />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Group 4: destructive */}
              <ToolbarBtn
                onClick={() => setShowDeleteDialog(true)}
                label="Delete"
                danger
              >
                <Trash2 size={13} />
              </ToolbarBtn>
            </div>

            <ExportButtons
              transcription={{
                id: transcription.id,
                title,
                full_text: activeText,
                segments: activeSegments ?? null,
              }}
            />
          </div>
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
              {/* Top fade — taller for better masking */}
              <div
                className="absolute top-0 inset-x-0 h-20 z-10 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
                }}
              />

              <div className="h-full overflow-y-auto py-6 pr-2 pb-28">
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

              {/* Bottom fade — taller */}
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

      {/* ── Floating audio player ── */}
      {audioUrl && showResults && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <AudioPlayer
              src={audioUrl}
              onTimeUpdate={setAudioTime}
              seekRef={seekRef}
            />
          </div>
        </div>
      )}

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
