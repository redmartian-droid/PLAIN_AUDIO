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

          <button onClick={() => setUploadOpen(true)} className="btn-primary">
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
        {/* Record — left side, icon-only */}
        <button
          onClick={() => setRecordOpen(true)}
          className="btn-icon w-11 h-11"
          aria-label="Record audio"
          title="Record audio"
        >
          <Mic size={16} aria-hidden />
        </button>

        {/* Upload — primary, right side */}
        <button onClick={() => setUploadOpen(true)} className="btn-primary">
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
