import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
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
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      {/* Back nav */}
      <Link
        href="/dashboard/folders"
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground/50 mb-6 animate-fade-up",
          "transition-colors duration-200 hover:text-muted-foreground",
          "active:opacity-70",
        )}
      >
        <ChevronLeft size={13} />
        All folders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 animate-fade-up [animation-delay:40ms]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="font-display text-[28px] font-semibold tracking-tight leading-none text-foreground">
              {folder.name}
            </h1>
            {folder.is_default && (
              <span className="text-[11px] font-medium text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 px-2 py-0.5 rounded-full leading-none">
                Default
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground/50 tabular-nums">
            {count} {count === 1 ? "transcription" : "transcriptions"} · Created{" "}
            {formatRelativeTime(folder.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <FolderActions folderId={id} folderName={folder.name} />
          <NewTranscriptionButton folderId={id} />
        </div>
      </div>

      {/* Content */}
      {count === 0 ? (
        <div className="px-5 h-[66px] flex items-center animate-fade-up [animation-delay:80ms]">
          <p className="text-sm text-muted-foreground">0 transcriptions</p>
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

  return (
    <Link
      href={`/dashboard/transcriptions/${t.id}`}
      className={cn(
        "flex items-center gap-4 px-5 h-[66px]",
        "transition-colors duration-150",
        "hover:bg-accent/[0.35]",
        "group",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="truncate text-[15px] font-medium tracking-tight text-foreground">
          {t.title}
        </p>
        <p
          className={cn(
            "text-[13px] mt-0.5 tabular-nums",
            "text-muted-foreground/50",
            "transition-colors duration-150",
            "group-hover:text-muted-foreground/70",
          )}
        >
          {formatRelativeTime(t.created_at)}
          {t.duration_seconds ? ` · ${formatDuration(t.duration_seconds)}` : ""}
          {t.word_count ? ` · ${t.word_count.toLocaleString()} words` : ""}
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
