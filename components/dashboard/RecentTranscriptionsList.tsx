"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSelection } from "@/hooks/useSelection";
import {
  TranscriptionRow,
  TranscriptionRowData,
  Checkbox,
} from "./TranscriptionRow";
import { BulkActionsBar } from "./BulkActionsBar";
import { cn } from "@/lib/utils";
import { useTranscriptionDelete } from "@/hooks/useTranscriptionDelete";

export function RecentTranscriptionsList({
  transcriptions,
}: {
  transcriptions: TranscriptionRowData[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const { selected, toggle, toggleAll, clear, isSelected, count } =
    useSelection<string>();

  const { deleteTranscriptions } = useTranscriptionDelete(() => {
    clear();
    router.refresh();
  });

  const allIds = transcriptions.map((t) => t.id);
  const allSelected = count === allIds.length && allIds.length > 0;
  const someSelected = count > 0 && !allSelected;
  const selectionMode = count > 0;

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

  async function handleBulkDelete() {
    if (!selected.size) return;
    await deleteTranscriptions([...selected]);
  }

  async function handleBulkExport() {
    const { data } = await supabase
      .from("transcriptions")
      .select("title, full_text")
      .in("id", [...selected]);

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
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2.5 mb-2 px-1 shrink-0">
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
            "text-xs transition-colors",
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

      {/* Scroll container — expanded in print */}
      <div className="relative flex-1 min-h-0 print-list">
        {/* Top fade — hidden in print */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 h-8 print-no-fade",
            "bg-gradient-to-b from-background to-transparent",
            "transition-opacity duration-200",
            fadeTop ? "opacity-100" : "opacity-0",
          )}
        />

        <div
          ref={scrollRef}
          onScroll={updateFades}
          className={cn(
            "h-full overflow-y-auto pr-0.5 scrollbar-hidden",
            count > 0 && "pb-24 sm:pb-0.5",
          )}
        >
          <div className="space-y-1.5 py-0.5">
            {transcriptions.map((t) => (
              <TranscriptionRow
                key={t.id}
                transcription={t}
                selected={isSelected(t.id)}
                selectionMode={selectionMode}
                onSelect={() => toggle(t.id)}
              />
            ))}
          </div>
        </div>

        {/* Bottom fade — hidden in print */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 print-no-fade",
            "bg-gradient-to-t from-background to-transparent",
            "transition-opacity duration-200",
            fadeBottom ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      {/* Bulk actions — mobile bottom sheet, desktop inline */}
      <div
        className={cn(
          "sm:relative",
          count > 0
            ? "fixed bottom-0 left-0 right-0 z-30 sm:static sm:z-auto translate-y-0"
            : "fixed bottom-0 left-0 right-0 z-30 sm:static translate-y-full sm:translate-y-0",
          "transition-transform duration-300 ease-[cubic-bezier(.32,.72,.6,1)]",
          "bg-[#F8F7F4]/95 backdrop-blur-md border-t border-[#E2E0DB] sm:bg-transparent sm:backdrop-blur-none sm:border-0",
          "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-0 sm:py-0">
          <BulkActionsBar
            count={count}
            onClear={clear}
            onExport={handleBulkExport}
            onMove={handleBulkMove}
            onDelete={handleBulkDelete}
          />
        </div>
      </div>
    </div>
  );
}
