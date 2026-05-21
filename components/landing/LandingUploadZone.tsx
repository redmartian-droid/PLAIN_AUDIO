"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, FileAudio, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { savePendingFile } from "@/lib/pending-transcription";

const ACCEPTED = [
  ".mp3",
  ".wav",
  ".mp4",
  ".mov",
  ".m4a",
  ".flac",
  ".webm",
  ".aac",
];
const MAX_MB = 25;
const B = "#D63558";

export function LandingUploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (f: File) => {
    const okType =
      f.type.startsWith("audio/") ||
      f.type.startsWith("video/") ||
      ACCEPTED.some((ext) => f.name.toLowerCase().endsWith(ext));
    if (!okType) {
      setError("Unsupported file type.");
      return false;
    }
    if (f.size / 1024 / 1024 > MAX_MB) {
      setError(`Max ${MAX_MB}MB for free accounts.`);
      return false;
    }
    return true;
  };

  const pick = (f: File) => {
    if (!validate(f)) return;
    setError(null);
    setFile(f);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (++dragCounter.current === 1) setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (--dragCounter.current === 0) setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pick(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proceed = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }
    setLoading(true);
    await savePendingFile(file, { model: "accurate", speakerCount: "auto" });
    router.push("/signup?from=upload");
  };

  return (
    <div className="w-full p-5 space-y-2.5">
      {/* Drop zone — matches UploadModal's rounded-xl dashed style */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={cn(
          "rounded-xl border border-dashed transition-all duration-200 overflow-hidden",
          dragging
            ? "border-[#D63558]/40 bg-[#FFF4F6] cursor-copy"
            : file
              ? "border-[#e8e6e1] bg-[#fafaf8] cursor-default"
              : "border-[#e0ddd8] bg-[#fafaf8] hover:border-[#D63558]/25 hover:bg-[#FFFBFC] cursor-pointer",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED.join(",")}
          onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
        />

        {file ? (
          /* File selected — matches UploadModal's file row exactly */
          <div className="flex items-center gap-3 p-3.5">
            <FileAudio
              size={15}
              className="text-[#999] shrink-0"
              strokeWidth={1.5}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#111] truncate leading-none mb-1">
                {file.name}
              </p>
              <p className="text-[11px] text-[#aaa]">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[#bbb] hover:text-[#666] hover:bg-[#f0f0f0] transition-all shrink-0"
            >
              <X size={11} strokeWidth={2} />
            </button>
          </div>
        ) : (
          /* Empty / drag — matches UploadModal's empty state */
          <div className="flex flex-col items-center justify-center py-8 gap-2.5">
            <CloudUpload
              size={16}
              className={cn(
                "transition-all duration-200",
                dragging ? "text-[#D63558] scale-110" : "text-[#ccc]",
              )}
              strokeWidth={1.5}
            />
            <div className="text-center space-y-1">
              <p className="text-[13px] font-medium text-[#111]">
                {dragging
                  ? "Release to upload"
                  : "Drop a file or click to browse"}
              </p>
              <p className="text-[11px] text-[#aaa]">
                MP3, WAV, MP4, M4A, MOV — up to 25 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-red-500 pl-0.5">{error}</p>}

      {/* CTA — matches ExportButtons: brand pink, rounded-xl, spring animation */}
      <button
        onClick={proceed}
        disabled={loading}
        className={cn(
          "w-full inline-flex items-center justify-center gap-2",
          "text-white text-sm font-semibold px-6 py-3 rounded-2xl",
          "[transition:background-color_150ms_ease,box-shadow_150ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1)]",
          "hover:opacity-85 hover:shadow-md hover:-translate-y-0.5",
          "active:scale-[.97] active:shadow-none active:translate-y-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63558]/50",
          "disabled:opacity-50 disabled:pointer-events-none",
        )}
        style={{ background: loading ? "#B8294A" : B }}
      >
        {loading ? "Saving…" : file ? "Transcribe this file" : "Start for free"}
        {!loading && <ArrowRight size={14} strokeWidth={2} />}
      </button>
    </div>
  );
}
