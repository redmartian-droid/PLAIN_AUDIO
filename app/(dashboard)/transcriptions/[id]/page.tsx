import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { formatTimestamp, type TranscriptionSegment } from "@/lib/gemini";
import {
  FileAudio,
  Clock,
  Hash,
  Globe,
  Download,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { MoveToFolderDropdown } from "@/components/dashboard/MoveToFolderDropdown";

export default async function TranscriptionPage({
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

  const { data: t } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!t) notFound();

  const segments: TranscriptionSegment[] = t.segments || [];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-parchment/90 backdrop-blur-md border-b border-border px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-mist hover:text-ink transition-colors"
          >
            <ChevronLeft size={18} />
          </Link>
          <h1 className="font-semibold text-ink text-sm truncate max-w-xs">
            {t.title}
          </h1>
          <StatusBadge status={t.status} />
        </div>
        {t.status === "completed" && (
          <div className="flex items-center gap-4">
            <ExportButtons transcription={t} />
            <div className="h-4 w-px bg-border" />
            <MoveToFolderDropdown
              transcriptionId={t.id}
              currentFolderId={t.folder_id}
            />
          </div>
        )}
      </header>

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
        {t.status === "processing" || t.status === "pending" ? (
          <ProcessingState title={t.title} />
        ) : t.status === "failed" ? (
          <FailedState error={t.error_message} />
        ) : (
          <>
            {/* Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 stagger-children">
              {[
                {
                  icon: Clock,
                  label: "Duration",
                  value: t.duration_seconds
                    ? formatDuration(t.duration_seconds)
                    : "—",
                },
                {
                  icon: Hash,
                  label: "Words",
                  value: t.word_count?.toLocaleString() || "—",
                },
                {
                  icon: Globe,
                  label: "Language",
                  value: t.language?.toUpperCase() || "—",
                },
                {
                  icon: FileAudio,
                  label: "Transcribed",
                  value: formatRelativeTime(t.created_at),
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="bg-surface border border-border rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon size={12} className="text-mist" />
                    <span className="text-xs text-mist">{m.label}</span>
                  </div>
                  <p className="font-semibold text-ink text-sm">{m.value}</p>
                </div>
              ))}
            </div>

            {/* AI Summary */}
            {t.summary && (
              <div className="bg-terra-light border border-terra/20 rounded-2xl p-5 mb-6 animate-fade-up">
                <p className="text-xs font-bold text-terra uppercase tracking-wider mb-2">
                  ✦ AI Summary
                </p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {t.summary}
                </p>
              </div>
            )}

            {/* Transcript */}
            <div className="bg-surface border border-border rounded-2xl p-6 animate-fade-up [animation-delay:120ms]">
              <h2 className="font-semibold text-ink text-sm mb-5 pb-4 border-b border-border">
                Transcript
              </h2>
              <div className="transcript-text space-y-4">
                {segments.length > 0 ? (
                  segments.map((seg, i) => (
                    <p key={i}>
                      <span className="timestamp">
                        {formatTimestamp(seg.start)}
                      </span>
                      {seg.speaker && (
                        <span className="text-xs font-bold text-terra-dark mr-2">
                          {seg.speaker}:
                        </span>
                      )}
                      {seg.text}
                    </p>
                  ))
                ) : (
                  <p className="text-ink-soft leading-relaxed whitespace-pre-wrap">
                    {t.full_text}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s =
    {
      completed: "text-green-700 bg-green-50 border-green-100",
      processing: "text-yellow-700 bg-yellow-50 border-yellow-100",
      pending: "text-gray-500 bg-gray-50 border-gray-100",
      failed: "text-red-600 bg-red-50 border-red-100",
    }[status] ?? "text-gray-500 bg-gray-50 border-gray-100";

  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ProcessingState({ title }: { title: string }) {
  return (
    <div className="text-center py-20 animate-fade-up">
      <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mx-auto mb-5">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
      <h2 className="font-display text-2xl font-bold text-ink mb-2">
        Transcribing…
      </h2>
      <p className="text-sm text-mist max-w-xs mx-auto">
        Gemini is processing &ldquo;{title}&rdquo;. This usually takes under a
        minute.
      </p>
    </div>
  );
}

function FailedState({ error }: { error?: string | null }) {
  return (
    <div className="text-center py-20 animate-fade-up">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="font-display text-2xl font-bold text-ink mb-2">
        Transcription failed
      </h2>
      <p className="text-sm text-mist max-w-xs mx-auto mb-5">
        {error || "Something went wrong processing this file."}
      </p>
      <Link
        href="/dashboard/new"
        className="inline-flex items-center gap-2 bg-ink text-parchment text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ink-soft transition-colors"
      >
        Try again
      </Link>
    </div>
  );
}
