// app/api/transcribe/route.ts
// Returns a job ID instantly. Deepgram POSTs results to /api/webhooks/deepgram.
// Balanced model uses Gemini inlineData (synchronous, zero File API polling).

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  submitUrlTranscriptionJob,
  submitBytesTranscriptionJob,
} from "@/lib/deepgram";
import { transcribeYouTube, isYouTubeUrl } from "@/lib/youtube-transcript";
import {
  transcribeYouTubeWithGemini,
  transcribeAudioWithGemini,
  transcribeAudioBufferWithGemini,
} from "@/lib/gemini";
import type { GeminiTranscriptResult } from "@/lib/gemini";
import { z } from "zod";

const FREE_DAILY_LIMIT = 3;
const FREE_MAX_BYTES = 25 * 1024 * 1024;
const PRO_MAX_BYTES = 500 * 1024 * 1024;

const schema = z.object({
  title: z.string().max(200).optional().default("Untitled"),
  model: z.enum(["accurate", "balanced"]).optional().default("accurate"),
  speaker_count: z
    .union([
      z.literal("auto"),
      z.literal("1"),
      z.literal("2"),
      z.literal("3"),
      z.literal("4+"),
    ])
    .optional()
    .default("auto"),
});

// ─── SSRF Protection ──────────────────────────────────────────────────────────
/** Validates that a URL is safe to pass to external services (Deepgram, Gemini) */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    // Block private IP ranges and metadata endpoints
    const hostname = parsed.hostname.toLowerCase();
    return !hostname.match(
      /^(localhost|127\.|10\.|192\.168\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[01]\.|169\.254\.)/,
    );
  } catch {
    return false;
  }
}

// ─── File Type Validation ─────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
];

function isSafeMimeType(mimeType: string | null): string {
  if (!mimeType) return "audio/mpeg";
  const safe = ALLOWED_MIME_TYPES.includes(mimeType) ? mimeType : "audio/mpeg";
  return safe;
}

// ─── Verify a Blob is actually audio, not a JSON error response ─────────────
async function validateAudioBlob(blob: Blob, label: string): Promise<void> {
  if (blob.size === 0) {
    throw new Error(`${label}: file is 0 bytes`);
  }
  if (blob.size < 100) {
    throw new Error(
      `${label}: file is only ${blob.size} bytes — likely a JSON error, not audio`,
    );
  }
  const ab = await blob.arrayBuffer();
  const b = new Uint8Array(ab.slice(0, 4));
  // JSON starts with 0x7B 0x22 ({" )
  if (b[0] === 0x7b && b[1] === 0x22) {
    const preview = new TextDecoder().decode(ab.slice(0, 200));
    throw new Error(
      `${label}: file starts with JSON — Supabase returned an error instead of audio: ${preview}`,
    );
  }
  // Common audio magic bytes
  const isOgg =
    b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53; // "OggS"
  const isMp3 = b[0] === 0xff && (b[1] & 0xe0) === 0xe0;
  const isWav =
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46; // "RIFF"
  const isWebm =
    b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
  const isM4a =
    b[0] === 0x66 && b[1] === 0x74 && b[2] === 0x79 && b[3] === 0x70; // "ftyp"
  if (!isOgg && !isMp3 && !isWav && !isWebm && !isM4a) {
    const hex = Array.from(b)
      .map((x: number) => "0x" + x.toString(16).padStart(2, "0"))
      .join(" ");
    console.warn(`${label}: unrecognized audio magic bytes: ${hex}`);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const validated = schema.parse({
    title: formData.get("title"),
    model: formData.get("model"),
    speaker_count: formData.get("speaker_count"),
  });

  const storagePath = formData.get("storage_path") as string | null;
  const url = formData.get("url") as string | null;
  const fileSizeStr = formData.get("file_size") as string | null;
  const fileType = formData.get("file_type") as string | null;
  const originalFilename = formData.get("original_filename") as string | null;
  const folderId = formData.get("folder_id") as string | null;

  if (!storagePath && !url) {
    return NextResponse.json(
      { error: "No file or URL provided" },
      { status: 400 },
    );
  }

  // ─── Validate storage path belongs to user ──────────────────────────────────
  if (storagePath) {
    // Ensure the path starts with the user's own ID to prevent path traversal
    if (!storagePath.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: "Forbidden: storage path does not belong to user" },
        { status: 403 },
      );
    }
  }

  // ─── Validate URL for SSRF ──────────────────────────────────────────────────
  if (url && !isSafeUrl(url)) {
    return NextResponse.json(
      { error: "Invalid URL: cannot access private or local networks" },
      { status: 400 },
    );
  }

  // ─── Validate folder ownership if provided ────────────────────────────────
  if (folderId) {
    const { data: folder } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .single();

    if (!folder) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 403 });
    }
  }

  // ─── Profile & limits ───────────────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const isPro = profile.plan === "pro";
  const today = new Date().toISOString().split("T")[0];

  if (profile.daily_reset_at < today) {
    await supabase
      .from("profiles")
      .update({ daily_transcription_count: 0, daily_reset_at: today })
      .eq("id", user.id);
    profile.daily_transcription_count = 0;
  }

  if (!isPro && profile.daily_transcription_count >= FREE_DAILY_LIMIT) {
    return NextResponse.json(
      {
        error:
          "Daily limit reached. Upgrade to Pro for unlimited transcriptions.",
      },
      { status: 429 },
    );
  }

  if (fileSizeStr) {
    const fileSize = parseInt(fileSizeStr, 10);
    const maxBytes = isPro ? PRO_MAX_BYTES : FREE_MAX_BYTES;
    if (!isNaN(fileSize) && fileSize > maxBytes) {
      return NextResponse.json(
        { error: `File too large. ${isPro ? "500MB" : "25MB"} limit.` },
        { status: 413 },
      );
    }
  }

  // ─── Create DB record immediately ──────────────────────────────────────────
  const { data: record, error: insertError } = await supabase
    .from("transcriptions")
    .insert({
      user_id: user.id,
      title: validated.title,
      original_filename: originalFilename ?? url ?? "url-source",
      status: "processing",
      audio_storage_path: storagePath,
      folder_id: folderId || null,
      settings: {
        model: validated.model,
        speaker_count: validated.speaker_count,
        source_url: url ?? null,
      },
    })
    .select()
    .single();

  if (insertError || !record) {
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 },
    );
  }

  // ─── Download audio ONCE if file upload (shared by both models) ──────────
  let audioBlob: Blob | null = null;
  let audioArrayBuffer: ArrayBuffer | null = null;

  if (storagePath) {
    let lastError: any = null;
    // Short retry loop for the race condition between client upload and this request
    for (let attempt = 1; attempt <= 5; attempt++) {
      const { data: blob, error: dlError } = await supabase.storage
        .from("audio-uploads")
        .download(storagePath);

      if (blob && !dlError) {
        audioBlob = blob;
        break;
      }
      lastError = dlError;
      if (attempt < 5) {
        await new Promise((res) => setTimeout(res, 600));
      }
    }

    if (!audioBlob) {
      throw new Error(
        `Failed to download audio from storage: ${lastError?.message || "unknown"}`,
      );
    }

    await validateAudioBlob(audioBlob, "Storage download");
    audioArrayBuffer = await audioBlob.arrayBuffer();
  }

  const options = {
    speakerCount: validated.speaker_count,
  };

  // ─── Route by model & source type ──────────────────────────────────────────
  try {
    // ═══════════════════════════════════════════════════════════════════════
    // BALANCED MODEL — Gemini direct transcription (synchronous, NO File API polling)
    // ═══════════════════════════════════════════════════════════════════════
    if (validated.model === "balanced") {
      let geminiResult: GeminiTranscriptResult;

      if (audioArrayBuffer) {
        // Pass raw bytes via inlineData — zero upload latency, zero polling
        const safeFileType = isSafeMimeType(fileType);
        geminiResult = await transcribeAudioBufferWithGemini(
          audioArrayBuffer,
          safeFileType,
          validated.speaker_count,
        );
      } else if (url) {
        const mimeType = isYouTubeUrl(url) ? "video/mp4" : "audio/mpeg";
        geminiResult = await transcribeAudioWithGemini(
          url,
          mimeType,
          validated.speaker_count,
        );
      } else {
        throw new Error("No file or URL provided");
      }

      // GUARD: reject empty transcripts so they don't get marked completed
      if (!geminiResult.fullText || geminiResult.fullText.trim().length === 0) {
        throw new Error("Gemini returned an empty transcript");
      }

      await supabase
        .from("transcriptions")
        .update({
          raw_text: geminiResult.fullText,
          segments_raw: geminiResult.segments,
          clean_text: geminiResult.fullText,
          segments_clean: geminiResult.segments,
          language: geminiResult.language,
          duration_seconds: geminiResult.durationSeconds ?? null,
          word_count: geminiResult.wordCount,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      await supabase.rpc("increment_transcription_count", {
        user_id: user.id,
      });

      // Return "processing" so the frontend polling UI runs before redirect
      return NextResponse.json({ id: record.id, status: "processing" });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACCURATE MODEL — Deepgram + Gemini repair (async)
    // ═══════════════════════════════════════════════════════════════════════
    if (url && isYouTubeUrl(url)) {
      const result = await transcribeYouTube(url, transcribeYouTubeWithGemini);

      await supabase
        .from("transcriptions")
        .update({
          raw_text: result.fullText,
          segments_raw: result.segments,
          clean_text: result.fullText,
          segments_clean: result.segments,
          language: result.language,
          duration_seconds: result.durationSeconds,
          word_count: result.wordCount,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      await supabase.rpc("increment_transcription_count", {
        user_id: user.id,
      });

      // Return "processing" so the frontend polling UI runs before redirect
      return NextResponse.json({ id: record.id, status: "processing" });
    }

    // ─── File upload: send raw bytes directly to Deepgram (sync) ────────────
    // This bypasses all signed-URL / accessibility issues.
    // NOTE: Vercel maxDuration is 60s. For files > ~2 min, use the async URL path below instead.
    if (audioBlob) {
      console.log("Sending raw bytes to Deepgram:", {
        size: audioBlob.size,
        type: audioBlob.type || fileType || "audio/mpeg",
      });

      const result = await submitBytesTranscriptionJob(audioBlob, {
        ...options,
        // NO callbackUrl — we want synchronous results
      });

      // GUARD: empty audio / no speech is not a server error
      if (!result.fullText || result.fullText.trim().length === 0) {
        throw new Error(
          "No speech could be detected in the uploaded audio. The file may be silent, contain only music, or use an unsupported codec.",
        );
      }

      await supabase
        .from("transcriptions")
        .update({
          raw_text: result.fullText,
          segments_raw: result.segments,
          clean_text: result.fullText,
          segments_clean: result.segments,
          language: result.language,
          duration_seconds: result.durationSeconds,
          word_count: result.wordCount,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      await supabase.rpc("increment_transcription_count", {
        user_id: user.id,
      });

      // Return "processing" so the frontend polling UI runs before redirect
      return NextResponse.json({ id: record.id, status: "processing" });
    }

    // ─── Direct external URL: async webhook (for large files / long audio) ────
    if (url) {
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/deepgram?record_id=${record.id}&user_id=${user.id}`;
      console.log("Direct URL:", url);
      console.log("Callback URL:", callbackUrl);

      await submitUrlTranscriptionJob(url, { ...options, callbackUrl });
      return NextResponse.json({ id: record.id, status: "processing" });
    }

    throw new Error("No file or URL provided");
  } catch (error) {
    await supabase
      .from("transcriptions")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    console.error("Transcription submit error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start transcription. Please try again.",
      },
      { status: 500 },
    );
  }
}
