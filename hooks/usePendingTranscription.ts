"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  loadPendingFile,
  loadPendingMeta,
  clearPending,
} from "@/lib/pending-transcription";

function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Call once on your DashboardPage.
 * If ?resumeTranscription=1 is in the URL and a pending file exists in IndexedDB,
 * it uploads and kicks off transcription automatically.
 *
 * @param onStart  called when upload begins — use to show processing UI
 * @param onDone   called with the new transcription id when queued
 * @param onError  called on failure
 */
export function usePendingTranscription(callbacks: {
  onStart: (filename: string) => void;
  onDone: (id: string) => void;
  onError: (msg: string) => void;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (params.get("resumeTranscription") !== "1") return;
    ran.current = true;

    // Strip the query param cleanly
    router.replace("/dashboard", { scroll: false });

    (async () => {
      const [file, meta] = await Promise.all([
        loadPendingFile(),
        loadPendingMeta(),
      ]);
      if (!file || !meta) return;

      callbacks.onStart(file.name);

      try {
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser();
        if (authErr || !user) throw new Error("Not authenticated.");

        const ext = file.name.split(".").pop() ?? "mp3";
        const storagePath = `${user.id}/${generateId()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("audio-uploads")
          .upload(storagePath, file, {
            contentType: file.type || "audio/mpeg",
            upsert: false,
          });

        if (uploadErr) throw new Error(uploadErr.message);

        const title = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        const form = new FormData();
        form.set("title", title);
        form.set("model", meta.model);
        form.set("speaker_count", meta.speakerCount);
        form.set("storage_path", storagePath);
        form.set("file_size", String(file.size));
        form.set("file_type", file.type || "audio/mpeg");
        form.set("original_filename", file.name);

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Server error");

        await clearPending();
        callbacks.onDone(data.id);
      } catch (err) {
        await clearPending();
        callbacks.onError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
