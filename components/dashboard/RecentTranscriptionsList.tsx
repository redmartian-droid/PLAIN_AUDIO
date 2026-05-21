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
import { useTranscriptionDelete } from "@/hooks/useTranscriptionDelete"; // NEW

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

  // ─── UPDATED: use shared hook ──────────────────────────────────────────
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
          aria-label={allSelected ? "Deselect all" : "Select all"}
          className={cn(
            "flex items-center gap-2 text-xs transition-colors",
            selectionMode
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
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
          className="h-full overflow-y-auto pr-0.5 scrollbar-hidden"
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

      <BulkActionsBar
        count={count}
        onClear={clear}
        onExport={handleBulkExport}
        onMove={handleBulkMove}
        onDelete={handleBulkDelete}
      />
    </div>
  );
}
