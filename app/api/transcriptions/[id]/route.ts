import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership and get storage path
  const { data: transcription, error: fetchError } = await supabase
    .from("transcriptions")
    .select("id, audio_storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !transcription) {
    return NextResponse.json(
      { error: "Transcription not found" },
      { status: 404 },
    );
  }

  // Delete DB record first (source of truth)
  const { error: dbError } = await supabase
    .from("transcriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (dbError) {
    return NextResponse.json(
      { error: "Failed to delete transcription" },
      { status: 500 },
    );
  }

  // Best-effort storage cleanup
  if (transcription.audio_storage_path) {
    const { error: storageError } = await supabase.storage
      .from("audio-uploads")
      .remove([transcription.audio_storage_path]);

    if (storageError) {
      console.warn("Failed to delete storage file:", storageError);
    }
  }

  return NextResponse.json({ success: true });
}
