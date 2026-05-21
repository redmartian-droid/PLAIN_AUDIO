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

export function LandingUploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
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
      <div
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={cn(
          "upload-zone",
          dragging && "dragging",
          file && "has-file",
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
          <div className="file-chip">
            <FileAudio size={15} className="file-chip-icon" strokeWidth={1.5} />
            <div className="file-chip-meta">
              <p className="file-chip-name">{file.name}</p>
              <p className="file-chip-size">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="btn-icon-micro"
              aria-label="Remove file"
            >
              <X size={11} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="upload-zone-empty">
            <CloudUpload
              size={16}
              className={cn("upload-icon", dragging && "active")}
              strokeWidth={1.5}
            />
            <div className="text-center space-y-1">
              <p className="upload-zone-label">
                {dragging
                  ? "Release to upload"
                  : "Drop a file or click to browse"}
              </p>
              <p className="upload-zone-hint">
                MP3, WAV, MP4, M4A, MOV — up to 25 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-error-micro">{error}</p>}

      <button
        onClick={proceed}
        disabled={loading}
        aria-busy={loading}
        aria-label={
          loading
            ? "Saving file"
            : file
              ? "Transcribe this file"
              : "Start for free"
        }
        className="btn-cta"
      >
        {loading ? "Saving…" : file ? "Transcribe this file" : "Start for free"}
        {!loading && <ArrowRight size={14} strokeWidth={2} />}
      </button>
    </div>
  );
}
