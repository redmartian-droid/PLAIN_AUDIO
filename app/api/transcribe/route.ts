import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/gemini";

const FREE_DAILY_LIMIT = 3;
const FREE_MAX_BYTES = 25 * 1024 * 1024; // 25MB
const PRO_MAX_BYTES = 500 * 1024 * 1024; // 500MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const isPro = profile.plan === "pro";

  // Reset daily count if new day
  if (profile.daily_reset_at < new Date().toISOString().split("T")[0]) {
    await supabase
      .from("profiles")
      .update({ daily_transcription_count: 0, daily_reset_at: new Date().toISOString().split("T")[0] })
      .eq("id", user.id);
    profile.daily_transcription_count = 0;
  }

  // Check daily limit (free users only)
  if (!isPro && profile.daily_transcription_count >= FREE_DAILY_LIMIT) {
    return NextResponse.json(
      { error: "Daily transcription limit reached. Upgrade to Pro for unlimited transcriptions." },
      { status: 429 }
    );
  }

  // Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string) || "Untitled";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // File size check
  const maxBytes = isPro ? PRO_MAX_BYTES : FREE_MAX_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. ${isPro ? "500MB" : "25MB"} limit.` },
      { status: 413 }
    );
  }

  // Create DB record with pending status
  const { data: record, error: insertError } = await supabase
    .from("transcriptions")
    .insert({
      user_id: user.id,
      title,
      original_filename: file.name,
      status: "processing",
    })
    .select()
    .single();

  if (insertError || !record) {
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }

  try {
    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe
    const result = await transcribeAudio(buffer, file.type || "audio/mpeg", file.name);

    // Update record with results
    await supabase
      .from("transcriptions")
      .update({
        full_text: result.fullText,
        segments: result.segments,
        language: result.language,
        duration_seconds: result.durationSeconds,
        word_count: result.wordCount,
        summary: result.summary,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    // Increment daily count
    await supabase
      .from("profiles")
      .update({ daily_transcription_count: profile.daily_transcription_count + 1 })
      .eq("id", user.id);

    return NextResponse.json({ id: record.id, status: "completed" });
  } catch (error) {
    // Mark as failed
    await supabase
      .from("transcriptions")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 500 }
    );
  }
}
