import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { NewTranscriptionButton } from "@/components/dashboard/NewTranscriptionButton";
import { FolderActions } from "@/components/dashboard/FolderActions";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatDuration } from "@/lib/utils";

export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: folder, error: folderError }, { data: transcriptions }] =
    await Promise.all([
      supabase
        .from("folders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("transcriptions")
        .select("id, title, status, duration_seconds, word_count, created_at")
        .eq("folder_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  if (folderError || !folder) notFound();

  const count = transcriptions?.length ?? 0;

  return (
    <div className="flex-1 px-4 py-6 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fade-up [animation-delay:40ms]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-2">
          <Link
            href="/dashboard/folders"
            className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-150 shrink-0"
          >
            Folders
          </Link>
          <span className="text-xs text-muted-foreground/25" aria-hidden>
            /
          </span>
          <span className="text-xs text-muted-foreground/60 truncate min-w-0">
            {folder.name}
          </span>
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 min-w-0">
              {/*
                text-xl on mobile (20px) — enough hierarchy without
                fighting the action cluster for horizontal space.
                font-display stays, just lighter at this size.
              */}
              <h1 className="text-xl sm:text-[28px] font-semibold font-display tracking-tight leading-snug text-foreground truncate">
                {folder.name}
              </h1>
              {folder.is_default && (
                <span className="text-[11px] font-medium text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 px-2 py-0.5 rounded-full leading-none shrink-0">
                  Default
                </span>
              )}
            </div>
            {/* Drop "Created" — date is self-explanatory */}
            <p className="text-xs text-muted-foreground/50 tabular-nums whitespace-nowrap">
              {count} {count === 1 ? "transcription" : "transcriptions"}
              {" · "}
              {formatRelativeTime(folder.created_at)}
            </p>
          </div>

          {/*
            gap-1.5 instead of gap-2 — tightens the button cluster
            by 2px per gap which matters when you have 3 buttons.
          */}
          <div className="flex items-center gap-1.5 shrink-0">
            <FolderActions folderId={id} folderName={folder.name} />
            <NewTranscriptionButton folderId={id} />
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
          {transcriptions!.map((t) => (
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
