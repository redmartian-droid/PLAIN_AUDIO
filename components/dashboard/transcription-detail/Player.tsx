"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause } from "lucide-react";

// ─── Supabase config ────────────────────────────────────────────────────────
const PROJECT_REF = "fgxcwdibkzxaqcruolhm";
const BUCKET = "audio-uploads";

export function getPublicUrl(path: string): string {
  return `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET}/${path}`;
}

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const BTN_COLOR = "#D63558";
const BAR_PLAYED = "#fce8ee";
const BAR_UNPLAYED = "rgba(214, 53, 88, 0.12)";

const fontMono = {
  fontFamily: "var(--font-mono,'Courier New',monospace)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Audio Player ─────────────────────────────────────────────────────────────

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
  const svgRef = useRef<SVGSVGElement>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);
  const [waveform, setWaveform] = React.useState<number[]>(() =>
    buildFakeWaveform(80),
  );

  // Audio analysis refs — never stored in state to avoid re-renders
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  // Store waveform in a ref so animation loop can read latest without closure staleness
  const waveformRef = useRef<number[]>(buildFakeWaveform(80));
  const progressRef = useRef(0);

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

  // Decode audio for static waveform shape
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
        const normalized = bars.map((v) => Math.max(0.06, v / max));
        setWaveform(normalized);
        waveformRef.current = normalized;
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

  // Force audio element to reset on mount (catches stale browser media state)
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
  }, []);

  // CRITICAL: Clean up everything on unmount.
  // We explicitly remove the src and call load() to flush Chrome's media cache
  // so the next mount gets a completely fresh media resource.
  React.useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load(); // forces the browser to release the media pipeline
      }
      analyserRef.current?.disconnect();
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
      freqDataRef.current = null;
    };
  }, []);

  // Animation loop: directly mutates SVG rects, zero React re-renders
  const startAnimation = React.useCallback(() => {
    const analyser = analyserRef.current;
    const freqData = freqDataRef.current;
    const svg = svgRef.current;
    if (!analyser || !freqData || !svg) return;

    const rects = svg.querySelectorAll<SVGRectElement>("rect[data-bar]");

    const tick = () => {
      analyser.getByteFrequencyData(freqData);
      const binCount = freqData.length;
      const playedCount = Math.round(progressRef.current * BAR_COUNT);

      rects.forEach((rect, i) => {
        const staticAmp = waveformRef.current[i] ?? 0.1;
        const binIndex = Math.floor((i / BAR_COUNT) * binCount * 0.75);
        const live = (freqData[binIndex] ?? 0) / 255;
        const amp = Math.max(0.06, staticAmp * 0.6 + live * 0.4);
        const barH = Math.max(2, amp * (WAVEFORM_H - 4));
        rect.setAttribute("height", String(barH));
        rect.setAttribute("y", String((WAVEFORM_H - barH) / 2));
        rect.setAttribute("fill", i < playedCount ? BAR_PLAYED : BAR_UNPLAYED);
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [BAR_COUNT, WAVEFORM_H]);

  const stopAnimation = React.useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    // Reset bars to static waveform
    const svg = svgRef.current;
    if (!svg) return;
    const rects = svg.querySelectorAll<SVGRectElement>("rect[data-bar]");
    const playedCount = Math.round(progressRef.current * BAR_COUNT);
    rects.forEach((rect, i) => {
      const amp = waveformRef.current[i] ?? 0.1;
      const barH = Math.max(2, amp * (WAVEFORM_H - 4));
      rect.setAttribute("height", String(barH));
      rect.setAttribute("y", String((WAVEFORM_H - barH) / 2));
      rect.setAttribute("fill", i < playedCount ? BAR_PLAYED : BAR_UNPLAYED);
    });
  }, [BAR_COUNT, WAVEFORM_H]);

  React.useEffect(() => {
    const seekFn = (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      if (!isPlaying) audio.play().catch(() => {});
    };
    seekRef.current = seekFn;
    return () => {
      if (seekRef.current === seekFn) seekRef.current = null;
    };
  }, [seekRef, isPlaying]);

  // Lazy Web Audio setup — only initialise on first play click.
  // This guarantees a fresh AudioContext + MediaElementSource every
  // time the component mounts, avoiding stale graph issues.
  const ensureAudioGraph = React.useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || audioCtxRef.current) return;

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
      console.error("Web Audio setup failed:", e);
    }
  }, []);

  const togglePlay = React.useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Must resume AudioContext on user gesture (browser autoplay policy)
    await ensureAudioGraph();
    if (audioCtxRef.current?.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (e) {
        console.error("Audio play failed:", e);
      }
    }
  }, [isPlaying, ensureAudioGraph]);

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

  // Update played/unplayed colors when time changes (outside animation loop, i.e. when paused)
  const handleTimeUpdate = React.useCallback(
    (t: number) => {
      setCurrentTime(t);
      onTimeUpdate(t);
      const p = duration > 0 ? t / duration : 0;
      progressRef.current = p;
      // When paused, the animation loop isn't running so update colors here
      if (!isPlaying) {
        const svg = svgRef.current;
        if (!svg) return;
        const playedCount = Math.round(p * BAR_COUNT);
        svg
          .querySelectorAll<SVGRectElement>("rect[data-bar]")
          .forEach((rect, i) => {
            rect.setAttribute(
              "fill",
              i < playedCount ? BAR_PLAYED : BAR_UNPLAYED,
            );
          });
      }
    },
    [duration, isPlaying, onTimeUpdate, BAR_COUNT],
  );

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
        crossOrigin="anonymous"
        preload="metadata"
        onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => {
          setIsPlaying(true);
          startAnimation();
        }}
        onPause={() => {
          setIsPlaying(false);
          stopAnimation();
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          progressRef.current = 0;
          onTimeUpdate(0);
          stopAnimation();
        }}
      />

      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
        style={{ background: BTN_COLOR, color: "#fff" }}
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
          ref={svgRef}
          viewBox={`0 0 ${BAR_TOTAL_W} ${WAVEFORM_H}`}
          preserveAspectRatio="none"
          className="w-full cursor-pointer"
          style={{ height: WAVEFORM_H }}
          onClick={handleWaveformClick}
          aria-label="Seek audio"
        >
          {waveform.slice(0, BAR_COUNT).map((amp, i) => {
            const x = i * (BAR_W + BAR_GAP);
            const barH = Math.max(2, amp * (WAVEFORM_H - 4));
            return (
              <rect
                key={i}
                data-bar={i}
                x={x}
                y={(WAVEFORM_H - barH) / 2}
                width={BAR_W}
                height={barH}
                rx={BAR_W / 2}
                fill={BAR_UNPLAYED}
              />
            );
          })}
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
          "fixed bottom-4 left-0 right-0 px-6",
          "md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-2xl md:px-0",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="pointer-events-auto">
          {/* key={src} destroys old audio element + Web Audio graph, mounts fresh */}
          <AudioPlayer
            key={src}
            src={src}
            onTimeUpdate={onTimeUpdate}
            seekRef={seekRef}
          />
        </div>
      </div>

      <div className="h-24 md:h-0" aria-hidden />
    </>
  );
}
