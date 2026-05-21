"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Stage =
  | "idle"
  | "recording"
  | "uploading"
  | "processing"
  | "done"
  | "error";

const STEPS = [
  { id: "uploading", label: "Uploading", sublabel: "Sending to servers" },
  {
    id: "processing",
    label: "Transcribing",
    sublabel: "Identifying speech and speakers",
  },
  { id: "done", label: "Complete", sublabel: "Your transcript is ready" },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getStepIndex(stage: Stage): number {
  return (
    (
      {
        idle: -1,
        recording: -1,
        uploading: 0,
        processing: 1,
        done: 2,
        error: -1,
      } as Record<Stage, number>
    )[stage] ?? -1
  );
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resolveRef = useRef<((blob: Blob) => void) | null>(null);

  // Kill the mic if the component unmounts mid-recording
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(s);
      streamRef.current = s;

      const mimeType =
        [
          "audio/webm;codecs=opus",
          "audio/mp4",
          "audio/ogg;codecs=opus",
          "audio/webm",
        ].find((type) => MediaRecorder.isTypeSupported(type)) || "audio/webm";

      const recorder = new MediaRecorder(s, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        s.getTracks().forEach((t) => t.stop());
        resolveRef.current?.(blob);
      };

      recorder.start(100);
      setIsRecording(true);
      setDuration(0);
      setError(null);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      return true;
    } catch {
      setError("Microphone access denied or not available.");
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    return new Promise<Blob>((resolve) => {
      resolveRef.current = resolve;
      mediaRecorderRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      setStream(null);
    });
  }, []);

  const reset = useCallback(() => {
    setDuration(0);
    setError(null);
    chunksRef.current = [];
  }, []);

  return { isRecording, duration, stream, error, start, stop, reset };
}

// ─── Visualizer ───────────────────────────────────────────────────────────────

function AudioVisualizer({ stream }: { stream: MediaStream | null }) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const bars = barsRef.current.filter(Boolean);
      const step = Math.floor(dataArray.length / bars.length);

      bars.forEach((bar, i) => {
        const value = dataArray[i * step];
        const height = Math.max(4, (value / 255) * 36);
        bar!.style.height = `${height}px`;
      });

      animationRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationRef.current);
      audioContext.close();
    };
  }, [stream]);

  return (
    <div className="flex items-end justify-center gap-[3px] h-[40px]">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className="w-[3px] rounded-full bg-[#D63558] transition-[height] duration-75"
          style={{ height: 4 }}
        />
      ))}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────────

interface RecordModalProps {
  open: boolean;
  onClose: () => void;
  folderId?: string;
}

export function RecordModal({ open, onClose, folderId }: RecordModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [processingLabel, setProcessingLabel] = useState("Recording");

  const {
    isRecording,
    duration,
    stream,
    error: recorderError,
    start,
    stop,
    reset,
  } = useAudioRecorder();

  const isProcessing = ["uploading", "processing", "done"].includes(stage);

  // Mount / unmount
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimateIn(true)),
      );
    } else {
      setAnimateIn(false);
      const t = setTimeout(() => {
        setMounted(false);
        setStage("idle");
        setError(null);
        setRecordId(null);
        setProcessingLabel("Recording");
        reset();
      }, 220);
      return () => clearTimeout(t);
    }
  }, [open, reset]);

  // Escape — blocked while recording so you don't accidentally kill the mic
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage !== "recording" && !isProcessing)
        onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [stage, isProcessing, onClose]);

  // Realtime subscription
  useEffect(() => {
    if (!recordId) return;
    setStage("processing");

    const channel = supabase
      .channel(`transcription:${recordId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transcriptions",
          filter: `id=eq.${recordId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          if (updated.status === "completed") {
            setStage("done");
            setTimeout(
              () => router.push(`/dashboard/transcriptions/${recordId}`),
              600,
            );
          }
          if (updated.status === "failed") {
            setStage("error");
            setError(
              (updated.error_message as string) || "Transcription failed.",
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recordId, router, supabase]);

  const handleStart = async () => {
    const ok = await start();
    if (ok) setStage("recording");
  };

  const handleStop = async () => {
    const blob = await stop();
    await submit(blob);
  };

  const submit = async (blob: Blob) => {
    setProcessingLabel(`Recording (${formatTime(duration)})`);
    setStage("uploading");
    setError(null);

    try {
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const fileName = `Recording ${new Date().toLocaleString().replace(/[/:]/g, "-")}.${ext}`;
      const file = new File([blob], fileName, {
        type: blob.type || "audio/webm",
      });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("Authentication error.");

      const storagePath = `${user.id}/${generateId()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("audio-uploads")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const formData = new FormData();
      formData.set("title", "Voice recording");
      // Gemini-only path — no Deepgram, handles browser audio quirks better
      formData.set("model", "balanced");
      formData.set("speaker_count", "auto");
      formData.set("storage_path", storagePath);
      formData.set("file_size", String(file.size));
      formData.set("file_type", file.type);
      formData.set("original_filename", file.name);
      if (folderId) formData.set("folder_id", folderId);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);

      if (data.status === "completed") {
        setStage("done");
        setTimeout(
          () => router.push(`/dashboard/transcriptions/${data.id}`),
          600,
        );
      } else {
        setRecordId(data.id);
      }
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: animateIn ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          transition: "background 220ms ease",
        }}
        onClick={() => !isProcessing && onClose()}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full max-w-[400px] overflow-hidden",
          "bg-card border border-border/[0.08]",
          "rounded-2xl",
          "shadow-[0_8px_40px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)]",
          "transition-[opacity,transform] duration-[220ms]",
          "[transition-timing-function:cubic-bezier(0.34,1.2,0.64,1)]",
          animateIn
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-[0.98]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/[0.08]">
          <p className="text-[14px] font-medium tracking-tight text-foreground">
            {stage === "recording" ? "Recording…" : "New recording"}
          </p>
          {!isProcessing && (
            <button
              onClick={onClose}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                "text-muted-foreground/50 hover:text-muted-foreground",
                "hover:bg-accent/[0.50]",
                "transition-colors duration-150",
              )}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {stage === "idle" && (
            <div className="flex flex-col items-center gap-5 py-6">
              {/* Record button */}
              <button
                onClick={handleStart}
                className={cn(
                  "relative w-20 h-20 rounded-full flex items-center justify-center",
                  "bg-[#D63558] text-white",
                  "shadow-lg shadow-[#D63558]/20",
                  "transition-transform duration-200",
                  "hover:scale-105 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63558] focus-visible:ring-offset-2",
                )}
              >
                <Mic size={28} strokeWidth={2} />
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full animate-ping bg-[#D63558]/30" />
              </button>

              <div className="text-center">
                <p className="text-[13px] font-medium text-foreground">
                  Click to start recording
                </p>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                  Max 30 minutes · Uses your browser microphone
                </p>
              </div>

              {(error || recorderError) && (
                <div className="flex items-start gap-2 text-[11px] text-destructive bg-destructive/[0.06] border border-destructive/15 rounded-lg px-3 py-2.5 w-full">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  {error || recorderError}
                </div>
              )}
            </div>
          )}

          {stage === "recording" && (
            <div className="flex flex-col items-center gap-5 py-2">
              {/* Red indicator + timer */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D63558] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D63558]" />
                </span>
                <span className="text-[28px] font-semibold tracking-tight tabular-nums text-foreground">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Visualizer */}
              <AudioVisualizer stream={stream} />

              {/* Stop button */}
              <button
                onClick={handleStop}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  "bg-foreground text-background",
                  "transition-transform duration-150",
                  "hover:opacity-85 active:scale-90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/40",
                )}
              >
                <Square size={16} fill="currentColor" />
              </button>

              <p className="text-[11px] text-muted-foreground/45">
                Click stop to transcribe
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-1">
              {STEPS.map((step, i) => {
                const activeIndex = getStepIndex(stage);
                const isCompleted = i < activeIndex;
                const isActive = i === activeIndex;

                return (
                  <div key={step.id} className="flex items-stretch gap-3.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          "border transition-all duration-500",
                          isCompleted
                            ? "bg-foreground border-foreground"
                            : isActive
                              ? "border-foreground/40 bg-foreground/[0.06]"
                              : "border-border/25 bg-transparent",
                        )}
                      >
                        {isCompleted && (
                          <svg
                            width="9"
                            height="7"
                            viewBox="0 0 9 7"
                            fill="none"
                          >
                            <path
                              d="M1 3.5L3.2 5.8L8 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
                        )}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={cn(
                            "w-px flex-1 my-1 min-h-[20px] transition-all duration-700",
                            isCompleted
                              ? "bg-foreground/25"
                              : "bg-border/[0.15]",
                          )}
                        />
                      )}
                    </div>

                    <div className="pb-5">
                      <p
                        className={cn(
                          "text-[13px] font-medium leading-tight transition-colors duration-300",
                          isActive
                            ? "text-foreground"
                            : isCompleted
                              ? "text-muted-foreground"
                              : "text-muted-foreground/35",
                        )}
                      >
                        {step.label}
                      </p>
                      {(isActive || isCompleted) && (
                        <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                          {step.sublabel}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {stage === "error" && (
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-[12px] text-destructive bg-destructive/[0.06] border border-destructive/15 rounded-xl px-3.5 py-3">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                {error}
              </div>
              <button
                onClick={() => {
                  setStage("idle");
                  setError(null);
                  reset();
                }}
                className={cn(
                  "w-full h-[38px] rounded-lg",
                  "bg-accent/[0.35] hover:bg-accent/[0.55]",
                  "text-[13px] font-medium text-foreground",
                  "transition-colors duration-150",
                )}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
