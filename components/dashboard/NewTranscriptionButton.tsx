"use client";

import { useState } from "react";
import { CloudUpload, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { UploadModal } from "@/components/dashboard/UploadModal";
import { RecordModal } from "@/components/dashboard/RecordModal";

interface NewTranscriptionButtonProps {
  className?: string;
  variant?: "default" | "full";
  profile?: { glossary_terms: string[] };
  folderId?: string;
}

export function NewTranscriptionButton({
  className,
  variant = "default",
  profile,
  folderId,
}: NewTranscriptionButtonProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const router = useRouter();

  if (variant === "full") {
    return (
      <>
        <div className={cn("flex flex-col gap-2 w-full", className)}>
          <button onClick={() => setRecordOpen(true)} className="btn-secondary">
            <Mic size={15} aria-hidden />
            Record audio
          </button>

          <button
            onClick={() => setUploadOpen(true)}
            aria-label="Transcribe files"
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "bg-[#D63558] text-white font-semibold rounded-xl",
              "min-h-[44px] px-4 text-sm",
              "[transition:background-color_150ms_ease,box-shadow_150ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1)]",
              "hover:bg-[#D63558]/80 hover:shadow-md hover:-translate-y-0.5",
              "active:scale-[.97] active:shadow-none active:translate-y-0",
            )}
          >
            <CloudUpload size={17} aria-hidden />
            Transcribe files
          </button>
        </div>
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onOpenSettings={() => router.push("/dashboard/settings")}
          folderId={folderId}
        />
        <RecordModal
          open={recordOpen}
          onClose={() => setRecordOpen(false)}
          folderId={folderId}
        />
      </>
    );
  }

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Record — left side, icon-only square */}
        <button
          onClick={() => setRecordOpen(true)}
          className={cn(
            "flex items-center justify-center shrink-0",
            "size-11 rounded-xl border border-border/50",
            "text-muted-foreground/60",
            "[transition:background-color_200ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1),border-color_200ms_ease,color_200ms_ease]",
            "hover:bg-accent/40 hover:text-foreground hover:border-border",
            "active:scale-90",
            "focus:outline-none focus:ring-2 focus:ring-[#D63558]/40 focus:ring-offset-2 focus:ring-offset-background",
          )}
          aria-label="Record audio"
          title="Record audio"
        >
          <Mic size={16} aria-hidden />
        </button>

        {/* Upload — primary, right side, icon-only on mobile */}
        <button
          onClick={() => setUploadOpen(true)}
          aria-label="Transcribe files"
          title="Transcribe files"
          className={cn(
            "inline-flex items-center justify-center gap-2 shrink-0",
            "size-11 sm:min-h-[44px] sm:w-auto sm:px-4",
            "bg-[#D63558] text-white font-semibold rounded-xl text-sm",
            "[transition:background-color_150ms_ease,box-shadow_150ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1)]",
            "hover:bg-[#D63558]/80 hover:shadow-md hover:-translate-y-0.5",
            "active:scale-[.97] active:shadow-none active:translate-y-0",
          )}
        >
          <CloudUpload size={17} aria-hidden />
          <span className="hidden sm:inline">Transcribe files</span>
        </button>
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onOpenSettings={() => router.push("/dashboard/settings")}
        folderId={folderId}
      />
      <RecordModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        folderId={folderId}
      />
    </>
  );
}
