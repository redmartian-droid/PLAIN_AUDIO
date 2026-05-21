import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TranscriptionsSearch } from "@/components/dashboard/TranscriptionsSearch";

export default async function TranscriptionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: transcriptions } = await supabase
    .from("transcriptions")
    .select(
      "id, title, created_at, status, duration_seconds, word_count, language, clean_text",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const transcriptionsWithPreviews =
    transcriptions?.map((t) => ({
      ...t,
      preview: t.clean_text
        ? t.clean_text.slice(0, 120).trimEnd() +
          (t.clean_text.length > 120 ? "…" : "")
        : undefined,
    })) ?? [];

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <TranscriptionsSearch
        initialTranscriptions={transcriptionsWithPreviews}
      />
    </div>
  );
}
