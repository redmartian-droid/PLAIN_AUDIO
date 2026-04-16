"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileAudio, Plus, Search, X } from "lucide-react";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Transcription = {
  id: string;
  title: string;
  full_text: string;
  created_at: string;
  status: string;
  duration_seconds: number;
  word_count: number;
  language: string;
};

// Highlight matching search terms in text
function highlightMatches(text: string, query: string) {
  if (!query.trim()) return text;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  return text.replace(
    regex,
    '<mark className="bg-amber-light text-amber-dark">$1</mark>',
  );
}

export function TranscriptionsSearch({
  initialTranscriptions,
}: {
  initialTranscriptions: Transcription[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [transcriptions, setTranscriptions] = useState<Transcription[]>(
    initialTranscriptions,
  );
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setTranscriptions(initialTranscriptions);
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await supabase
          .from("transcriptions")
          .select(
            "id, title, created_at, status, word_count, duration_seconds, language",
          )
          .textSearch("fts", searchQuery, {
            type: "websearch",
            config: "english",
          })
          .order("created_at", { ascending: false });

        setTranscriptions((data as Transcription[]) || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, initialTranscriptions]);

  return (
    <>
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink mb-1">
            All transcriptions
          </h1>
          <p className="text-mist text-sm">{transcriptions.length} total</p>
        </div>
        <Link
          href="/dashboard/new"
          className="flex items-center gap-2 bg-amber text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-dark transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber/20"
        >
          <Plus size={14} />
          New
        </Link>
      </div>

      <div className="mb-6 animate-fade-up [animation-delay:40ms] relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-mist pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search transcriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-ink placeholder-mist focus:outline-none focus:ring-2 focus:ring-terra/50 focus:border-terra transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-ink transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {searchQuery && transcriptions.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-16 text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-terra-light flex items-center justify-center mx-auto mb-4">
            <FileAudio size={20} className="text-terra" />
          </div>
          <h3 className="font-semibold text-ink mb-1.5">
            No results for "{searchQuery}"
          </h3>
          <p className="text-sm text-mist mb-5">Try a different search term.</p>
          <button
            onClick={() => setSearchQuery("")}
            className="inline-flex items-center gap-2 bg-ink text-parchment text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ink-soft transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : !transcriptions || transcriptions.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-16 text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-terra-light flex items-center justify-center mx-auto mb-4">
            <FileAudio size={20} className="text-terra" />
          </div>
          <h3 className="font-semibold text-ink mb-1.5">
            No transcriptions yet
          </h3>
          <p className="text-sm text-mist mb-5">
            Your transcriptions will appear here once you upload a file.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 bg-ink text-parchment text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ink-soft transition-colors"
          >
            <Plus size={14} /> Create your first
          </Link>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {isLoading && (
            <div className="text-center text-mist text-sm">Searching...</div>
          )}
          {!isLoading &&
            transcriptions.map((t) => (
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
                    <HighlightedText text={t.title} query={searchQuery} />
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
    </>
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

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
  );

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-terra-light text-terra-dark font-medium">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
