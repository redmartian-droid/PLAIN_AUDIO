"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileAudio, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NewTranscriptionButton } from "./NewTranscriptionButton";
import {
  TranscriptionRow,
  TranscriptionRowData,
  Checkbox,
} from "./TranscriptionRow";
import { BulkActionsBar } from "./BulkActionsBar";
import { useSelection } from "@/hooks/useSelection";

type Transcription = TranscriptionRowData & {
  full_text?: string;
  clean_text?: string;
};

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
  const router = useRouter();
  const { selected, toggle, toggleAll, clear, isSelected, count } =
    useSelection<string>();

  const allIds = transcriptions.map((t) => t.id);
  const allSelected = count === allIds.length && allIds.length > 0;
  const someSelected = count > 0 && !allSelected;
  const selectionMode = count > 0;

  // ── Scroll fade state ──────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setFadeTop(scrollTop > 8);
    setFadeBottom(scrollTop + clientHeight < scrollHeight - 8);
  }, []);

  useEffect(() => {
    updateFades();
  }, [transcriptions, updateFades]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setTranscriptions(initialTranscriptions);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("transcriptions")
          .select(
            "id, title, created_at, status, word_count, duration_seconds, language, clean_text",
          )
          .textSearch("fts", searchQuery, {
            type: "websearch",
            config: "english",
          })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Search error:", error);
          return;
        }

        const withPreviews = (data ?? []).map((t) => ({
          ...t,
          preview: t.clean_text
            ? t.clean_text.slice(0, 120).trimEnd() +
              (t.clean_text.length > 120 ? "…" : "")
            : undefined,
        }));

        setTranscriptions(withPreviews as Transcription[]);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, initialTranscriptions]);

  // ─── UPDATED: bulk delete with storage cleanup ─────────────────────────
  async function handleBulkDelete() {
    if (!selected.size) return;

    const { data: items } = await supabase
      .from("transcriptions")
      .select("id, audio_storage_path")
      .in("id", [...selected])
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "");

    const paths = (items ?? [])
      .map((t) => t.audio_storage_path)
      .filter((p): p is string => !!p);

    await supabase
      .from("transcriptions")
      .delete()
      .in("id", [...selected]);

    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("audio-uploads")
        .remove(paths);
      if (storageError) {
        console.warn("Failed to delete storage files:", storageError);
      }
    }

    clear();
    router.refresh();
  }

  async function handleBulkExport() {
    const ids = [...selected];
    const { data } = await supabase
      .from("transcriptions")
      .select("title, full_text")
      .in("id", ids);

    const content = (data ?? [])
      .map((t) => `### ${t.title}\n\n${t.full_text ?? ""}`)
      .join("\n\n---\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcriptions_export.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleBulkMove() {
    console.log("Move selected:", [...selected]);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between mb-6 sm:mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">
            All transcriptions
          </h1>
          <p className="text-muted-foreground text-sm">
            {transcriptions.length} total
          </p>
        </div>
        <NewTranscriptionButton />
      </div>

      {/* Search */}
      <div className="shrink-0 mb-6 animate-fade-up [animation-delay:40ms] relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search transcriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full min-h-[44px] pl-9 pr-11 py-3",
            "bg-card border border-border rounded-xl",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "transition-[border-color,box-shadow] duration-200 ease-in-out",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
          )}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2",
              "w-11 h-11 flex items-center justify-center",
              "text-muted-foreground",
              "[transition:color_200ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1)]",
              "hover:text-foreground active:scale-90",
            )}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Empty — no results */}
      {searchQuery && transcriptions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center animate-fade-up">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              No results for "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className={cn(
                "inline-flex items-center gap-2",
                "bg-primary text-primary-foreground",
                "text-sm font-semibold px-5 py-3 rounded-xl",
                "[transition:background-color_200ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1),box-shadow_200ms_ease]",
                "hover:bg-primary/90 hover:shadow-sm",
                "active:scale-[.97] active:shadow-none",
              )}
            >
              Clear search
            </button>
          </div>
        </div>
      ) : !transcriptions || transcriptions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center animate-fade-up">
          <p className="text-sm text-muted-foreground">0 transcriptions</p>
        </div>
      ) : (
        <>
          {/* Select-all — sits outside the scroll area */}
          <div className="shrink-0 flex items-center gap-2.5 mb-2 px-1">
            <button
              onClick={() => toggleAll(allIds)}
              aria-label={
                allSelected
                  ? "Deselect all"
                  : selectionMode
                    ? "Select all"
                    : "Select"
              }
              className={cn(
                "flex items-center gap-2 min-h-[44px] px-1",
                "text-xs transition-colors duration-200",
                selectionMode
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                "active:opacity-70",
              )}
            >
              <Checkbox checked={allSelected} indeterminate={someSelected} />
              <span>
                {allSelected
                  ? "Deselect all"
                  : selectionMode
                    ? "Select all"
                    : "Select"}
              </span>
            </button>
            {count > 0 && (
              <span className="text-xs text-muted-foreground">
                · {count} selected
              </span>
            )}
          </div>

          {/* Scroll container with fades */}
          <div className="flex-1 min-h-0 relative">
            {/* Top fade */}
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 z-10 h-8",
                "bg-gradient-to-b from-background to-transparent",
                "transition-opacity duration-200",
                fadeTop ? "opacity-100" : "opacity-0",
              )}
            />

            {/* Scrollable list */}
            <div
              ref={scrollRef}
              onScroll={updateFades}
              className="h-full overflow-y-auto pr-0.5 scrollbar-hidden"
            >
              <div className="space-y-2 stagger-children py-0.5">
                {isLoading ? (
                  <LoadingRows />
                ) : (
                  transcriptions.map((t) => (
                    <TranscriptionRow
                      key={t.id}
                      transcription={t}
                      selected={isSelected(t.id)}
                      selectionMode={selectionMode}
                      onSelect={() => toggle(t.id)}
                      showLanguage
                    >
                      <HighlightedText text={t.title} query={searchQuery} />
                    </TranscriptionRow>
                  ))
                )}
              </div>
            </div>

            {/* Bottom fade */}
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8",
                "bg-gradient-to-t from-background to-transparent",
                "transition-opacity duration-200",
                fadeBottom ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </>
      )}

      <BulkActionsBar
        className="shrink-0"
        count={count}
        onClear={clear}
        onExport={handleBulkExport}
        onMove={handleBulkMove}
        onDelete={handleBulkDelete}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingRows() {
  return (
    <div className="space-y-2" aria-label="Searching..." aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 w-full bg-card border border-border rounded-xl pl-4 pr-4 py-3"
          style={{ opacity: 1 - i * 0.2 }}
        >
          <div className="w-11 h-11 rounded-lg bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-muted animate-pulse rounded-md w-2/3" />
            <div className="h-3 bg-muted animate-pulse rounded-md w-1/3" />
          </div>
          <div className="h-6 w-14 bg-muted animate-pulse rounded-full shrink-0" />
        </div>
      ))}
    </div>
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
          <mark
            key={i}
            className="bg-primary/15 text-primary font-medium rounded-sm px-0.5 not-italic"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
