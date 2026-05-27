"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NewTranscriptionButton } from "@/components/dashboard/NewTranscriptionButton";
import { FolderActions } from "@/components/dashboard/FolderActions";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatDuration } from "@/lib/utils";

const fontSyne = {
  fontFamily: "var(--font-syne,'Helvetica Neue',sans-serif)",
} as const;

const fontMono = {
  fontFamily: "var(--font-mono,'Courier New',monospace)",
} as const;

interface Folder {
  id: string;
  name: string;
  is_default?: boolean;
  created_at: string;
  user_id: string;
}

interface Transcription {
  id: string;
  title: string;
  status: string;
  duration_seconds?: number | null;
  word_count?: number | null;
  created_at: string;
}

export default function FolderPageClient({
  folder: initialFolder,
  transcriptions: initialTranscriptions,
}: {
  folder: Folder;
  transcriptions: Transcription[];
}) {
  const supabase = createClient();
  const [folder, setFolder] = useState<Folder>(initialFolder);
  const [transcriptions] = useState<Transcription[]>(initialTranscriptions);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(initialFolder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isRenaming]);

  const handleRename = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === folder.name) {
      setNameDraft(folder.name);
      setIsRenaming(false);
      return;
    }

    const { error } = await supabase
      .from("folders")
      .update({ name: trimmed })
      .eq("id", folder.id);

    if (!error) {
      setFolder((prev) => ({ ...prev, name: trimmed }));
      setNameDraft(trimmed);
      setIsRenaming(false);
    }
  };

  const count = transcriptions.length;

  return (
    <div className="flex-1 px-4 py-6 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fade-up [animation-delay:40ms]">
        {/* ── Breadcrumb ── */}
        <nav
          className="flex items-center gap-1.5 mb-5 flex-wrap"
          aria-label="Breadcrumb"
        >
          <Link
            href="/dashboard"
            className="text-[12px] md:text-[13px] text-muted-foreground hover:opacity-70 transition-opacity duration-150"
            style={fontSyne}
          >
            dashboard
          </Link>
          <span
            className="text-muted-foreground/30 text-[11px] md:text-[12px] select-none"
            aria-hidden
          >
            &gt;
          </span>
          <Link
            href="/dashboard/folders"
            className="text-[12px] md:text-[13px] text-muted-foreground hover:opacity-70 transition-opacity duration-150"
            style={fontSyne}
          >
            folders
          </Link>
          <span
            className="text-muted-foreground/30 text-[11px] md:text-[12px] select-none"
            aria-hidden
          >
            &gt;
          </span>
          <span
            className="text-[12px] md:text-[13px] text-foreground font-semibold truncate max-w-[200px]"
            style={fontSyne}
          >
            {folder.name}
          </span>
        </nav>

        {/* Title row */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 min-w-0">
              {isRenaming ? (
                <div className="flex flex-col gap-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename();
                      if (e.key === "Escape") {
                        setNameDraft(folder.name);
                        setIsRenaming(false);
                      }
                    }}
                    onBlur={handleRename}
                    autoFocus
                    className="bg-transparent outline-none focus:bg-[#F0EEEB]/40 rounded-sm px-1 -mx-1 transition-colors duration-150"
                    style={{
                      ...fontSyne,
                      fontWeight: 600,
                      fontSize: "clamp(1.1rem, 2vw, 1.75rem)",
                      letterSpacing: "-0.02em",
                      color: "#0D0D0D",
                    }}
                  />
                  <p
                    style={{
                      ...fontMono,
                      fontSize: 9.5,
                      color: "#C4C1BC",
                      letterSpacing: "0.06em",
                    }}
                  >
                    return to save · esc to cancel
                  </p>
                </div>
              ) : (
                <h1
                  onClick={() => setIsRenaming(true)}
                  className="text-xl sm:text-[28px] font-semibold font-display tracking-tight leading-snug text-foreground cursor-pointer hover:opacity-70 transition-opacity"
                  title="Click to rename"
                >
                  {folder.name}
                </h1>
              )}
              {folder.is_default && (
                <span className="text-[11px] font-medium text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 px-2 py-0.5 rounded-full leading-none shrink-0">
                  Default
                </span>
              )}
            </div>
            <p
              style={{
                fontFamily: "var(--font-mono,'Courier New',monospace)",
                fontSize: 11,
                letterSpacing: "0.04em",
                color: "#AAA8A4",
              }}
            >
              {count} {count === 1 ? "transcription" : "transcriptions"}
              {" · "}
              {formatRelativeTime(folder.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <FolderActions
              folderId={folder.id}
              onStartRename={() => setIsRenaming(true)}
            />
            <NewTranscriptionButton folderId={folder.id} />
          </div>
        </div>
      </div>

      {/* Content */}
      {count === 0 ? (
        <div className="flex items-center justify-center py-20 animate-fade-up [animation-delay:80ms]">
          <p className="text-sm text-muted-foreground/40">
            No transcriptions yet.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-xl border border-border/[0.06] bg-card overflow-hidden",
            "divide-y divide-border/[0.06]",
            "animate-fade-up [animation-delay:80ms]",
          )}
        >
          {transcriptions.map((t) => (
            <FolderRow key={t.id} transcription={t} />
          ))}
        </div>
      )}
    </div>
  );
}

type FolderRowData = {
  id: string;
  title: string;
  created_at: string;
  status: string;
  duration_seconds?: number | null;
  word_count?: number | null;
};

function FolderRow({ transcription: t }: { transcription: FolderRowData }) {
  const isCompleted = t.status === "completed";

  const meta = [
    formatRelativeTime(t.created_at),
    t.duration_seconds ? formatDuration(t.duration_seconds) : null,
    t.word_count ? `${t.word_count.toLocaleString()} words` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/dashboard/transcriptions/${t.id}`}
      className={cn(
        "flex items-center gap-4 px-4 sm:px-5 min-h-[60px] py-3.5",
        "transition-colors duration-150",
        "hover:bg-accent/[0.35]",
        "active:bg-accent/50",
        "group",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="truncate text-[15px] font-medium tracking-tight text-foreground leading-snug">
          {t.title}
        </p>
        <p
          className={cn(
            "text-[12px] mt-0.5",
            "text-muted-foreground/50",
            "transition-colors duration-150",
            "group-hover:text-muted-foreground/70",
          )}
        >
          {meta}
        </p>
      </div>

      {isCompleted ? (
        <ChevronRight
          size={13}
          aria-hidden="true"
          className="text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors shrink-0"
        />
      ) : (
        <FolderRowStatus status={t.status} />
      )}
    </Link>
  );
}

function FolderRowStatus({ status }: { status: string }) {
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/[0.07] border border-primary/10 px-2 py-1 rounded-full shrink-0">
        <Loader2 size={9} className="animate-spin" />
        Processing
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-destructive bg-destructive/[0.07] border border-destructive/10 px-2 py-1 rounded-full shrink-0">
        <AlertCircle size={9} />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted border border-border/50 px-2 py-1 rounded-full shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
      Pending
    </span>
  );
}
