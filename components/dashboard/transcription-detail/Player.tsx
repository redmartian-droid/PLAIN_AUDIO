"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause } from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const B = "#D63558";
const fontMono = {
  fontFamily: "var(--font-mono,'Courier New',monospace)",
} as const;

// ─── Audio Player ─────────────────────────────────────────────────────────────

function shortTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildFakeWaveform(barCount: number): number[] {
  return Array.from({ length: barCount }, (_, i) => {
    const t = i / barCount;
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
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);
  const [waveform, setWaveform] = React.useState<number[]>(() =>
    buildFakeWaveform(80),
  );

  const BAR_COUNT = isMobile ? 40 : 80;
  const BAR_W = isMobile ? 3 : 2;
  const BAR_GAP = isMobile ? 2 : 1.5;
  const BAR_TOTAL_W = BAR_COUNT * (BAR_W + BAR_GAP);
  const WAVEFORM_H = isMobile ? 32 : 40;

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  React.useEffect(() => {
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
  }, [src, BAR_COUNT]);

  React.useEffect(() => {
    seekRef.current = (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      if (!isPlaying) audio.play().catch(() => {});
    };
  }, [seekRef, isPlaying]);

  const togglePlay = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});
  }, [isPlaying]);

  const handleWaveformClick = React.useCallback(
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
        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
        style={{ background: B, color: "#fff" }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause size={16} strokeWidth={2.5} />
        ) : (
          <Play size={16} strokeWidth={2.5} className="translate-x-px" />
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
            {waveform.slice(0, BAR_COUNT).map((amp, i) => {
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

          {/* Played */}
          <g clipPath="url(#cp-played-player)">
            {waveform.slice(0, BAR_COUNT).map((amp, i) => {
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

// ─── Player Wrapper ───────────────────────────────────────────────────────────

interface PlayerProps {
  src: string | null;
  onTimeUpdate: (time: number) => void;
  seekRef: React.MutableRefObject<((time: number) => void) | null>;
  visible: boolean;
}

export function Player({ src, onTimeUpdate, seekRef, visible }: PlayerProps) {
  if (!src || !visible) return null;

  return (
    <>
      <div
        className={cn(
          "z-50 pointer-events-none",
          // Mobile: float 16px from bottom, match page gutters (px-6)
          "fixed bottom-4 left-0 right-0 px-6",
          // Desktop: centered floating card
          "md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-2xl md:px-0",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="pointer-events-auto">
          <AudioPlayer
            src={src}
            onTimeUpdate={onTimeUpdate}
            seekRef={seekRef}
          />
        </div>
      </div>

      {/* Dynamic spacer to prevent content from being hidden behind player */}
      <div className="h-24 md:h-0" aria-hidden />
    </>
  );
}
