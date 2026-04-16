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
      "id, title, created_at, status, word_count, duration_seconds, language",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
      <TranscriptionsSearch initialTranscriptions={transcriptions || []} />
    </div>
  );
}
