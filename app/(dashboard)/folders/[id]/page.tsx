import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { FileAudio, ChevronLeft } from "lucide-react";
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

  const { data: folder } = await supabase
    .from("folders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!folder) notFound();

  const { data: transcriptions } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("folder_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8 animate-fade-up">
        <Link
          href="/dashboard/folders"
          className="text-mist hover:text-ink transition-colors"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink mb-1">
            {folder.name}
          </h1>
          <p className="text-mist text-sm">
            {transcriptions?.length || 0} transcriptions
          </p>
        </div>
      </div>

      {!transcriptions || transcriptions.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-16 text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-terra-light flex items-center justify-center mx-auto mb-4">
            <FileAudio size={20} className="text-terra" />
          </div>
          <h3 className="font-semibold text-ink mb-1.5">
            No transcriptions in this folder
          </h3>
          <p className="text-sm text-mist mb-5">
            Move transcriptions here to organize them.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 bg-ink text-parchment text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ink-soft transition-colors"
          >
            Create one
          </Link>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {transcriptions.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/transcriptions/${t.id}`}
              className="flex items-center gap-4 bg-surface border border-border rounded-xl px-4 py-4 hover:border-terra/30 hover:shadow-soft transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-parchment flex items-center justify-center shrink-0 group-hover:bg-terra-light transition-colors">
                <FileAudio
                  size={15}
                  className="text-mist group-hover:text-terra transition-colors"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">
                  {t.title}
                </p>
                <p className="text-xs text-mist mt-0.5">
                  {formatRelativeTime(t.created_at)}
                  {t.duration_seconds
                    ? ` · ${formatDuration(t.duration_seconds)}`
                    : ""}
                  {t.word_count
                    ? ` · ${t.word_count.toLocaleString()} words`
                    : ""}
                  {t.language ? ` · ${t.language.toUpperCase()}` : ""}
                </p>
              </div>
              <StatusChip status={t.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map = {
    completed: "text-green-700 bg-green-50 border-green-100",
    processing: "text-yellow-700 bg-yellow-50 border-yellow-100",
    pending: "text-gray-500 bg-gray-50 border-gray-100",
    failed: "text-red-600 bg-red-50 border-red-100",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${map[status as keyof typeof map] ?? map.pending}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
