// app/api/webhooks/deepgram/route.ts

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseDeepgramResponse } from "@/lib/deepgram";
import { repairTranscript } from "@/lib/gemini";
import crypto from "crypto";

// Use SERVICE ROLE (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function verifyDeepgramSignature(
  body: string,
  signature: string | null,
  secret: string,
): boolean {
  // CRITICAL: Reject if secret is not configured — don't default to accepting unverified webhooks
  if (!secret) return false;
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    // Buffers of different length throw — treat as mismatch
    return false;
  }
}

/** Rejects after `ms` milliseconds with a TimeoutError. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            Object.assign(new Error("Operation timed out"), {
              isTimeout: true,
            }),
          ),
        ms,
      ),
    ),
  ]);
}

async function markFailed(recordId: string, message: string) {
  const { error } = await supabase
    .from("transcriptions")
    .update({
      status: "failed",
      error_message: message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId);

  if (error) {
    console.error("❌ Failed to write failure state:", error);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log("🔔 WEBHOOK HIT", new Date().toISOString());

  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get("record_id");
  const userId = searchParams.get("user_id");

  if (!recordId || !userId) {
    console.log("❌ Missing params");
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // ─── Read & verify body ─────────────────────────────────────────────────────

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (e) {
    console.error("❌ Failed to read request body:", e);
    return NextResponse.json({ error: "Failed to read body" }, { status: 400 });
  }

  if (!rawBody || rawBody.trim().length === 0) {
    console.error("❌ Empty request body");
    await markFailed(recordId, "Empty webhook payload from Deepgram");
    return NextResponse.json({ received: true });
  }

  const signature = request.headers.get("dg-signature");
  const webhookSecret = process.env.DEEPGRAM_WEBHOOK_SECRET;

  if (
    webhookSecret &&
    !verifyDeepgramSignature(rawBody, signature, webhookSecret)
  ) {
    console.log("❌ Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ─── Parse payload ──────────────────────────────────────────────────────────

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    console.error("❌ Failed to parse JSON:", e);
    await markFailed(recordId, "Invalid JSON in Deepgram webhook");
    return NextResponse.json({ received: true });
  }

  // ─── Deepgram-level error ───────────────────────────────────────────────────

  if (payload?.err_code || payload?.error) {
    console.log("❌ Deepgram returned error:", payload);
    await markFailed(
      recordId,
      payload.err_msg || payload.error || "Deepgram processing error",
    );
    return NextResponse.json({ received: true });
  }

  // ─── Sanity check: results exist ────────────────────────────────────────────

  if (!payload?.results) {
    console.error(
      "❌ Payload missing results field:",
      JSON.stringify(payload).slice(0, 200),
    );
    await markFailed(recordId, "Deepgram payload missing results");
    return NextResponse.json({ received: true });
  }

  // ─── Atomic claim ───────────────────────────────────────────────────────────

  const { data: claimed, error: claimError } = await supabase
    .from("transcriptions")
    .update({ status: "processing" })
    .eq("id", recordId)
    .in("status", ["processing", "failed"])
    .select("audio_storage_path")
    .maybeSingle();

  if (claimError) {
    console.error("❌ Claim failed:", claimError);
    return NextResponse.json({ received: true, error: "claim_failed" });
  }

  if (!claimed) {
    console.log(
      "⚠️ Already processed or status mismatch (idempotency):",
      recordId,
    );
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  // ─── Parse Deepgram response ────────────────────────────────────────────────

  let result: ReturnType<typeof parseDeepgramResponse>;
  try {
    result = parseDeepgramResponse(payload);
  } catch (e) {
    console.error("❌ Failed to parse Deepgram response:", e);
    await markFailed(
      recordId,
      e instanceof Error ? e.message : "Failed to parse Deepgram response",
    );
    return NextResponse.json({ received: true });
  }

  if (!result.fullText || result.fullText.trim().length === 0) {
    console.warn("⚠️ Empty transcript — storing as completed with empty text");
    await supabase
      .from("transcriptions")
      .update({
        raw_text: "",
        segments_raw: [],
        clean_text: "",
        segments_clean: [],
        language: result.language ?? "en",
        duration_seconds: result.durationSeconds ?? null,
        word_count: 0,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    await supabase.rpc("increment_transcription_count", { user_id: userId });
    return NextResponse.json({ received: true });
  }

  // ─── Write raw transcript ───────────────────────────────────────────────────

  const { error: rawWriteError } = await supabase
    .from("transcriptions")
    .update({
      raw_text: result.fullText,
      segments_raw: result.segments,
      language: result.language,
      duration_seconds: result.durationSeconds,
      word_count: result.wordCount,
      status: "repairing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId);

  if (rawWriteError) {
    // Non-fatal — continue to repair, but log it
    console.error("❌ Raw DB write failed:", rawWriteError);
  }

  // ─── Gemini repair (with timeout + fallback) ────────────────────────────────

  // Budget: maxDuration is 60s. Deepgram parse + DB writes use ~5s.
  // Give Gemini 45s max, leaving a buffer for the final write.
  const REPAIR_TIMEOUT_MS = 45_000;

  let repaired: Awaited<ReturnType<typeof repairTranscript>>;
  let repairedWithGemini = true;

  try {
    repaired = await withTimeout(
      repairTranscript(result.fullText, result.segments, result.language),
      REPAIR_TIMEOUT_MS,
    );
  } catch (err) {
    const isTimeout = (err as any)?.isTimeout === true;
    console.error(
      isTimeout
        ? "⏱️ Gemini repair timed out — falling back to raw"
        : "❌ Gemini repair failed — falling back to raw",
      err,
    );
    // Fall back to storing the raw transcript as the clean version
    repaired = { fullText: result.fullText, segments: result.segments };
    repairedWithGemini = false;
  }

  // Sanity check: if Gemini returned empty text, fall back to raw
  if (!repaired.fullText || repaired.fullText.trim().length === 0) {
    console.warn("⚠️ Gemini repair returned empty text — falling back to raw");
    repaired = { fullText: result.fullText, segments: result.segments };
    repairedWithGemini = false;
  }

  // ─── Write clean transcript ─────────────────────────────────────────────────

  const { error: cleanWriteError } = await supabase
    .from("transcriptions")
    .update({
      clean_text: repaired.fullText,
      segments_clean: repaired.segments,
      status: "completed",
      // Flag if we fell back so you can re-try repair later if you want
      ...(repairedWithGemini
        ? {}
        : { error_message: "repair_skipped: used raw transcript" }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId);

  if (cleanWriteError) {
    console.error("❌ Clean DB write failed:", cleanWriteError);
    // The raw transcript is already stored — don't mark as failed,
    // it's better to surface a completed record with raw text than a failed one.
  }

  // ─── Increment usage ────────────────────────────────────────────────────────

  const { error: countError } = await supabase.rpc(
    "increment_transcription_count",
    { user_id: userId },
  );

  if (countError) {
    // Non-fatal — don't fail the whole request over a count
    console.error("❌ Failed to increment transcription count:", countError);
  }

  console.log(
    "🏁 Webhook completed:",
    recordId,
    repairedWithGemini ? "(repaired)" : "(raw fallback)",
  );
  return NextResponse.json({ received: true });
}
