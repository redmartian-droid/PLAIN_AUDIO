"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileAudio, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn, formatFileSize, ACCEPTED_EXTENSIONS, ACCEPTED_AUDIO_TYPES } from "@/lib/utils";

type UploadStage = "idle" | "uploading" | "transcribing" | "done" | "error";

const MAX_FREE_MB = 25;
const MAX_PRO_MB = 500;

export default function NewTranscriptionPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);

  const validateFile = useCallback((f: File): string | null => {
    if (!ACCEPTED_AUDIO_TYPES.includes(f.type) && !f.name.match(/\.(mp3|wav|webm|ogg|mp4|m4a|aac|flac|mov)$/i)) {
      return "Unsupported file type. Please upload an audio or video file.";
    }
    const sizeMB = f.size / (1024 * 1024);
    if (sizeMB > MAX_FREE_MB) {
      return `File too large. Free plan supports up to ${MAX_FREE_MB}MB. Upgrade to Pro for 500MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError(null);
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
  }, [validateFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setStage("uploading");
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 8, 85));
      }, 200);

      setStage("transcribing");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Transcription failed");
      }

      const data = await res.json();
      setTranscriptionId(data.id);
      setStage("done");

      setTimeout(() => {
        router.push(`/dashboard/transcriptions/${data.id}`);
      }, 1500);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">New transcription</h1>
        <p className="text-mist text-sm">Upload an audio or video file to get started.</p>
      </div>

      {stage === "done" ? (
        <div className="text-center py-16 animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink mb-2">Transcription complete!</h2>
          <p className="text-mist text-sm">Redirecting you to the result…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up [animation-delay:60ms]">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-2xl transition-all cursor-pointer",
              file
                ? "border-border bg-surface p-5"
                : "p-12 text-center hover:border-terra/50 hover:bg-terra-light/30",
              isDragging && "drop-active bg-terra-light/30",
              !file && "border-border"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {file ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-terra-light flex items-center justify-center shrink-0">
                  <FileAudio size={18} className="text-terra" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{file.name}</p>
                  <p className="text-xs text-mist mt-0.5">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(""); }}
                  className="text-mist hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-parchment"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-parchment border border-border flex items-center justify-center mx-auto mb-4">
                  <Upload size={22} className="text-mist" />
                </div>
                <p className="font-semibold text-ink mb-1">Drop your file here</p>
                <p className="text-sm text-mist mb-3">or click to browse</p>
                <p className="text-xs text-mist-light">
                  MP3, WAV, MP4, MOV, M4A, FLAC, OGG · Max 25MB on free plan
                </p>
              </>
            )}
          </div>

          {/* Title */}
          {file && (
            <div className="space-y-1.5 animate-fade-up">
              <label className="block text-xs font-semibold text-ink-soft tracking-wide uppercase">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this transcription a name"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-mist-light focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Progress bar */}
          {(stage === "uploading" || stage === "transcribing") && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-mist">
                <span className="flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  {stage === "uploading" ? "Uploading file…" : "Transcribing with Gemini…"}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-terra rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          {file && stage === "idle" && (
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-ink text-parchment font-semibold py-3.5 rounded-xl hover:bg-ink-soft transition-all hover:-translate-y-0.5 hover:shadow-lg animate-fade-up"
            >
              <FileAudio size={15} />
              Transcribe now
            </button>
          )}
        </form>
      )}
    </div>
  );
}
