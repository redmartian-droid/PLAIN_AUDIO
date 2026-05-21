"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useTranscriptionDelete(onComplete?: () => void) {
  const supabase = createClient();

  const deleteTranscriptions = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;

      // 1. Fetch storage paths before deleting rows
      const { data: items } = await supabase
        .from("transcriptions")
        .select("id, audio_storage_path")
        .in("id", ids);

      const paths = (items ?? [])
        .map((t) => t.audio_storage_path)
        .filter((p): p is string => !!p);

      // 2. Delete DB records first (source of truth)
      await supabase.from("transcriptions").delete().in("id", ids);

      // 3. Best-effort storage cleanup
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("audio-uploads")
          .remove(paths);
        if (storageError) {
          console.warn("Failed to delete storage files:", storageError);
        }
      }

      onComplete?.();
    },
    [supabase, onComplete],
  );

  return { deleteTranscriptions };
}
