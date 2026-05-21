"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CloudUpload,
  FileAudio,
  X,
  AlertCircle,
  Link2,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage =
  | "idle"
  | "dragging"
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

const SPEAKER_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4+", label: "4+" },
];

const MODEL_OPTIONS = [
  {
    id: "accurate" as const,
    label: "Most accurate",
    description: "Deepgram + Gemini. Best for clean English audio.",
  },
  {
    id: "balanced" as const,
    label: "Balanced",
    description: "Gemini only. Handles code-switching and multilingual audio.",
  },
];

const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
  "audio/aac",
  "audio/x-m4a",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];
const MAX_MB = 25;

const POLL_INTERVAL_MS = 4_000;
const GIVE_UP_MS = 5 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStepIndex(stage: Stage): number {
  return (
    (
      {
        idle: -1,
        dragging: -1,
        uploading: 0,
        processing: 1,
        done: 2,
        error: -1,
      } as Record<Stage, number>
    )[stage] ?? -1
  );
}

function titleFromFile(f: File) {
  return f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
}

function titleFromUrl(url: string) {
  try {
    const u = new URL(url);
    const v = u.searchParams.get("v");
    if (v) return `YouTube – ${v}`;
    const seg = u.pathname.split("/").filter(Boolean).pop();
    return seg ? decodeURIComponent(seg) : u.hostname;
  } catch {
    return "Untitled";
  }
}

function isValidUrl(s: string) {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}

// Resolves the correct MIME type for a file — browser's file.type is
// unreliable for .ogg, .m4a, etc. and often falls back to "" which
// causes Deepgram to receive the wrong content-type and return empty results.
function getMimeType(file: File): string {
  const browserType = file.type?.toLowerCase() || "";

  // Browser-recorded blobs often have codec suffixes or generic types.
  // CRITICAL: check webm BEFORE opus — browsers report WebM+Opus as
  // "audio/webm; codecs=opus". If we test "includes('opus')" first we
  // mislabel it as OGG and Deepgram returns empty results.
  if (browserType && browserType !== "application/octet-stream") {
    if (browserType.includes("webm")) return "audio/webm";
    if (browserType.includes("opus")) return "audio/ogg";
    if (browserType.includes("ogg")) return "audio/ogg";
    if (browserType.includes("wav")) return "audio/wav";
    if (browserType.includes("mpeg")) return "audio/mpeg";
    if (browserType.includes("mp4")) return "video/mp4";
    if (browserType.includes("quicktime")) return "video/quicktime";
    if (browserType.includes("m4a")) return "audio/x-m4a";
    if (browserType.includes("aac")) return "audio/aac";
    if (browserType.includes("flac")) return "audio/flac";
    return file.type;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    opus: "audio/ogg",
    webm: "audio/webm",
    m4a: "audio/x-m4a",
    aac: "audio/aac",
    flac: "audio/flac",
    mp4: "video/mp4",
    mov: "video/quicktime",
  };
  return map[ext ?? ""] ?? "audio/mpeg";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
  folderId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadModal({
  open,
  onClose,
  onOpenSettings,
  folderId,
}: UploadModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [processingLabel, setProcessingLabel] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [model, setModel] = useState<"accurate" | "balanced">("accurate");
  const [speakerCount, setSpeakerCount] = useState("auto");

  const isProcessing = ["uploading", "processing", "done"].includes(stage);

  // ─── Mount / unmount ───────────────────────────────────────────────────────

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
        setFile(null);
        setUrl("");
        setError(null);
        setRecordId(null);
        setProcessingLabel("");
        setShowAdvanced(false);
        setModel("accurate");
        setSpeakerCount("auto");
        dragCounterRef.current = 0;
      }, 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isProcessing, onClose]);

  // ─── Realtime + polling ────────────────────────────────────────────────────
  //
  // Three failure modes this handles:
  //   1. Realtime event arrives before subscription is ready (race condition)
  //      → fixed by fetching status immediately on SUBSCRIBED
  //   2. Gemini/Vercel kills the function mid-flight, or client loses connection
  //      → polling catches the completed/failed record even if realtime missed it
  //   3. Everything genuinely hangs (Gemini down, Deepgram stuck, etc.)
  //      → hard timeout tells the user to check back rather than spinning forever

  useEffect(() => {
    if (!recordId) return;
    setStage("processing");

    let settled = false;

    function handleStatus(status: string, errorMessage?: string | null) {
      if (settled) return;
      settled = true;

      if (status === "completed") {
        setStage("done");
        setTimeout(
          () => router.push(`/dashboard/transcriptions/${recordId}`),
          600,
        );
      } else if (status === "failed") {
        setStage("error");
        setError(errorMessage || "Transcription failed. Please try again.");
      }
    }

    const poll = setInterval(async () => {
      if (settled) {
        clearInterval(poll);
        return;
      }
      const { data } = await supabase
        .from("transcriptions")
        .select("status, error_message")
        .eq("id", recordId)
        .single();

      if (data?.status === "completed" || data?.status === "failed") {
        clearInterval(poll);
        handleStatus(data.status, data.error_message);
      }
    }, POLL_INTERVAL_MS);

    const giveUp = setTimeout(() => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      setStage("error");
      setError(
        "Transcription is taking longer than expected. Check back in a few minutes — it may still complete.",
      );
    }, GIVE_UP_MS);

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
          if (updated.status === "completed" || updated.status === "failed") {
            clearInterval(poll);
            clearTimeout(giveUp);
            handleStatus(
              updated.status as string,
              updated.error_message as string | null,
            );
          }
        },
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data } = await supabase
            .from("transcriptions")
            .select("status, error_message")
            .eq("id", recordId)
            .single();

          if (data?.status === "completed" || data?.status === "failed") {
            clearInterval(poll);
            clearTimeout(giveUp);
            handleStatus(data.status, data.error_message);
          }
        }
      });

    return () => {
      clearInterval(poll);
      clearTimeout(giveUp);
      supabase.removeChannel(channel);
    };
  }, [recordId, router, supabase]);

  // ─── File handling ─────────────────────────────────────────────────────────

  const selectFile = (f: File) => {
    const valid =
      ACCEPTED_TYPES.includes(f.type) ||
      /\.(mp3|wav|webm|ogg|mp4|m4a|aac|flac|mov)$/i.test(f.name);
    if (!valid) {
      setError("Unsupported file type. Please upload an audio or video file.");
      return;
    }
    if (f.size / (1024 * 1024) > MAX_MB) {
      setError(`File exceeds ${MAX_MB}MB. Upgrade to Pro for larger files.`);
      return;
    }
    setError(null);
    setFile(f);
  };

  // ─── Drag ──────────────────────────────────────────────────────────────────

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setStage("dragging");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setStage("idle");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!file && !isValidUrl(url)) return;

    const title = file ? titleFromFile(file) : titleFromUrl(url);
    setProcessingLabel(title);
    setStage("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("model", model);
      formData.set("speaker_count", speakerCount);

      if (folderId) formData.set("folder_id", folderId);

      if (file) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Authentication error. Please log in again.");
        }

        const mimeType = getMimeType(file);
        const ext = file.name.split(".").pop() ?? "mp3";
        const storagePath = `${user.id}/${generateId()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("audio-uploads")
          .upload(storagePath, file, {
            contentType: mimeType,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        formData.set("storage_path", storagePath);
        formData.set("file_size", String(file.size));
        formData.set("file_type", mimeType);
        formData.set("original_filename", file.name);
      } else if (url) {
        formData.set("url", url);
      }

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

  const canSubmit = !!file || isValidUrl(url);

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
        {/* ─── Processing view ────────────────────────────────────────────── */}
        {isProcessing ? (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-border/[0.08]">
              <p className="text-[14px] font-medium tracking-tight text-foreground truncate">
                {processingLabel || "Transcribing…"}
              </p>
              <p className="text-[11px] text-muted-foreground/55 mt-0.5">
                {file ? formatBytes(file.size) : "URL source"} ·{" "}
                {model === "balanced" ? "Balanced" : "Most accurate"}
              </p>
            </div>

            <div className="px-5 py-5">
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
          </>
        ) : (
          <>
            {/* ─── Idle / error view ────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/[0.08]">
              <p className="text-[14px] font-medium tracking-tight text-foreground">
                New transcription
              </p>
              <button
                onClick={onClose}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  "text-muted-foreground/50 hover:text-muted-foreground",
                  "hover:bg-accent/[0.50]",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border/40",
                )}
              >
                <X size={13} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {stage === "error" ? (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-[12px] text-destructive bg-destructive/[0.06] border border-destructive/15 rounded-xl px-3.5 py-3">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    {error}
                  </div>
                  <button
                    onClick={() => {
                      setStage("idle");
                      setError(null);
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
              ) : (
                <>
                  {/* ─── Drop zone ──────────────────────────────────────── */}
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !file && fileInputRef.current?.click()}
                    className={cn(
                      "relative rounded-xl border border-dashed transition-all duration-200 overflow-hidden",
                      file ? "cursor-default" : "cursor-pointer",
                      stage === "dragging"
                        ? "border-border/50 bg-accent/[0.28]"
                        : file
                          ? "border-border/[0.12] bg-accent/[0.15]"
                          : "border-border/20 bg-accent/[0.10] hover:border-border/35 hover:bg-accent/[0.20]",
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".mp3,.wav,.mp4,.mov,.m4a,.flac,.ogg,.webm,.aac"
                      onChange={(e) =>
                        e.target.files?.[0] && selectFile(e.target.files[0])
                      }
                    />

                    {file ? (
                      <div className="flex items-center gap-3 p-3.5">
                        <FileAudio
                          size={15}
                          className="text-muted-foreground/50 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground/55">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            setError(null);
                          }}
                          className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                            "text-muted-foreground/40 hover:text-muted-foreground",
                            "hover:bg-accent/[0.50]",
                            "transition-colors duration-150",
                          )}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 gap-2.5">
                        <CloudUpload
                          size={16}
                          className={cn(
                            "transition-all duration-200",
                            stage === "dragging"
                              ? "text-foreground scale-110"
                              : "text-muted-foreground/35",
                          )}
                        />
                        <div className="text-center">
                          <p className="text-[13px] font-medium text-foreground">
                            {stage === "dragging"
                              ? "Release to upload"
                              : "Drop a file or click to browse"}
                          </p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                            MP3, WAV, MP4, M4A, MOV — up to 25MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── URL input ──────────────────────────────────────── */}
                  <div
                    className={cn(
                      "rounded-lg border flex items-center gap-2 px-3",
                      "bg-accent/[0.28]",
                      "border-border/[0.08] focus-within:border-border/30",
                      "transition-[border-color] duration-150",
                    )}
                  >
                    <Link2
                      size={12}
                      className="text-muted-foreground/40 shrink-0"
                    />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && canSubmit && handleSubmit()
                      }
                      placeholder="Or paste a YouTube or audio URL…"
                      className={cn(
                        "flex-1 bg-transparent py-2.5",
                        "text-[13px] font-medium text-foreground",
                        "placeholder:text-muted-foreground/38 placeholder:font-normal",
                        "focus:outline-none",
                      )}
                    />
                    {url && isValidUrl(url) && (
                      <button
                        onClick={handleSubmit}
                        className={cn(
                          "shrink-0 w-5 h-5 rounded-md flex items-center justify-center",
                          "bg-foreground text-background",
                          "hover:opacity-80 transition-opacity duration-150",
                        )}
                      >
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-[11px] text-destructive bg-destructive/[0.06] border border-destructive/15 rounded-lg px-3 py-2.5">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  {/* ─── Submit ─────────────────────────────────────────── */}
                  {canSubmit && (
                    <button
                      onClick={handleSubmit}
                      className={cn(
                        "w-full h-[38px] rounded-lg",
                        "bg-foreground text-background",
                        "text-[13px] font-medium",
                        "transition-all duration-150",
                        "hover:opacity-85 active:scale-[0.98]",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-foreground/40",
                      )}
                    >
                      Transcribe
                    </button>
                  )}

                  {/* ─── Advanced options ───────────────────────────────── */}
                  <div>
                    <button
                      onClick={() => setShowAdvanced((v) => !v)}
                      className={cn(
                        "flex items-center gap-1.5",
                        "text-[11px] font-medium text-muted-foreground/45",
                        "hover:text-muted-foreground/70",
                        "transition-colors duration-150",
                      )}
                    >
                      <ChevronDown
                        size={11}
                        className={cn(
                          "transition-transform duration-200",
                          showAdvanced && "rotate-180",
                        )}
                      />
                      Advanced options
                    </button>

                    {showAdvanced && (
                      <div className="mt-3 space-y-4">
                        {/* Model */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-medium text-muted-foreground/55">
                            Model
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {MODEL_OPTIONS.map((option) => {
                              const active = model === option.id;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => setModel(option.id)}
                                  className={cn(
                                    "flex flex-col items-start p-3 rounded-lg border text-left",
                                    "transition-all duration-150",
                                    active
                                      ? "border-foreground/20 bg-foreground/[0.04]"
                                      : "border-border/[0.08] bg-accent/[0.15] hover:border-border/20",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "text-[13px] font-medium tracking-tight mb-1",
                                      active
                                        ? "text-foreground"
                                        : "text-foreground/65",
                                    )}
                                  >
                                    {option.label}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground/50 leading-snug">
                                    {option.description}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Speakers */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-medium text-muted-foreground/55">
                            Speakers
                          </label>
                          <div
                            className={cn(
                              "flex items-center gap-0.5 p-0.5",
                              "rounded-lg border border-border/[0.08] bg-accent/[0.15]",
                            )}
                          >
                            {SPEAKER_OPTIONS.map((option) => {
                              const active = speakerCount === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setSpeakerCount(option.value)}
                                  className={cn(
                                    "flex-1 h-7 rounded-md",
                                    "text-[12px] font-medium",
                                    "transition-all duration-150",
                                    active
                                      ? [
                                          "bg-card text-foreground",
                                          "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)]",
                                        ]
                                      : [
                                          "text-muted-foreground/45",
                                          "hover:text-muted-foreground/70",
                                        ],
                                  )}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
