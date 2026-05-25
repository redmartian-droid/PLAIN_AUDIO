// app/dashboard/transcriptions/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { TranscriptionDetail } from "@/components/dashboard/TranscriptionDetail";

const uuidSchema = z.string().uuid();

export default async function TranscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const parseResult = uuidSchema.safeParse(id);
  if (!parseResult.success) notFound();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: transcription, error } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !transcription) notFound();

  return (
    <TranscriptionDetail
      transcription={transcription}
    />
  );
}
