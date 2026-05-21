// lib/deepgram.ts
import { DeepgramClient } from "@deepgram/sdk";
import crypto from "crypto";

// Validate API key at module load
if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY environment variable is not set");
}

const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY });

export interface DeepgramSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface DeepgramResult {
  fullText: string;
  segments: DeepgramSegment[];
  language: string;
  durationSeconds: number;
  wordCount: number;
}

export interface DeepgramOptions {
  speakerCount?: string;
  domain?: string;
  callbackUrl?: string;
}

// ─── Safe number parser for Deepgram response fields ──────────────────────────
function safeNum(v: unknown): number {
  if (typeof v === "number" && isFinite(v)) return v;
  return 0;
}

// ─── Parse Deepgram webhook/sync response ─────────────────────────────────────

export function parseDeepgramResponse(data: any): DeepgramResult {
  const channel = data?.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];
  const utterances: any[] = data?.results?.utterances ?? [];
  const metadata = data?.metadata ?? {};

  if (!alternative && utterances.length === 0) {
    throw new Error("No transcription results from Deepgram");
  }

  const fullText: string =
    utterances.map((u) => u.transcript).join("\n") ||
    alternative?.transcript ||
    "";

  // GUARD: return empty result instead of throwing — silent audio is valid
  if (!fullText || fullText.trim().length === 0) {
    console.warn(
      "Deepgram returned empty transcript — audio may contain no speech",
    );
    return {
      fullText: "",
      segments: [],
      language: metadata?.detected_language || "en",
      durationSeconds: Math.round(safeNum(metadata?.duration)),
      wordCount: 0,
    };
  }

  const duration: number = safeNum(metadata?.duration);
  const words: any[] = alternative?.words || [];

  const wordCount =
    words.length || fullText.split(/\s+/).filter(Boolean).length;

  const language = metadata?.detected_language || "en";

  let segments: DeepgramSegment[] = [];

  if (utterances.length > 0) {
    segments = utterances.map((u) => ({
      start: safeNum(u.start),
      end: safeNum(u.end),
      text: u.transcript?.trim() || "",
      speaker:
        u.speaker !== undefined
          ? `Speaker ${(u.speaker as number) + 1}`
          : undefined,
    }));
  } else if (words.length > 0) {
    segments = buildSegmentsFromWords(words);
  } else if (fullText) {
    segments = [{ start: 0, end: duration, text: fullText }];
  }

  return {
    fullText,
    segments,
    language,
    durationSeconds: Math.round(duration),
    wordCount,
  };
}

function buildSegmentsFromWords(words: any[]): DeepgramSegment[] {
  if (!words.length) return [];

  const segments: DeepgramSegment[] = [];
  let currentSpeaker: string | undefined =
    words[0]?.speaker !== undefined
      ? `Speaker ${(words[0].speaker as number) + 1}`
      : undefined;
  let currentWords: string[] = [];
  let segmentStart = safeNum(words[0]?.start);
  let segmentEnd = safeNum(words[0]?.end);

  for (const word of words) {
    const speaker =
      word.speaker !== undefined
        ? `Speaker ${(word.speaker as number) + 1}`
        : undefined;

    if (speaker !== currentSpeaker && currentWords.length > 0) {
      segments.push({
        start: segmentStart,
        end: segmentEnd,
        text: currentWords.join(" "),
        speaker: currentSpeaker,
      });
      currentWords = [];
      currentSpeaker = speaker;
      segmentStart = word.start;
    }

    currentWords.push(word.punctuated_word ?? word.word);
    segmentEnd = word.end;
  }

  if (currentWords.length > 0) {
    segments.push({
      start: segmentStart,
      end: segmentEnd,
      text: currentWords.join(" "),
      speaker: currentSpeaker,
    });
  }

  return segments;
}

// ─── Submit URL job via REST API (async, with callback) ─────────────────────

export async function submitUrlTranscriptionJob(
  url: string,
  options: DeepgramOptions = {},
): Promise<{ requestId: string }> {
  const params = buildParams(options);

  if (options.callbackUrl) {
    params.callback = options.callbackUrl;
  }

  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === true) {
      queryParams.append(key, "true");
    } else if (value === false) {
      continue;
    } else if (Array.isArray(value)) {
      for (const item of value) {
        queryParams.append(key, item);
      }
    } else if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  }

  const apiUrl = `https://api.deepgram.com/v1/listen?url=${encodeURIComponent(url)}&${queryParams.toString()}`;

  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          // NO Content-Type — no body
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status >= 400 && response.status < 500) {
          throw new Error(
            `Non-retriable Deepgram error ${response.status}: ${errorText}`,
          );
        }
        throw new Error(`Deepgram API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const requestId =
        data.request_id || data.metadata?.request_id || crypto.randomUUID();

      console.log("Deepgram job submitted successfully:", { requestId, url });
      return { requestId };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      console.warn(
        `Deepgram submission attempt ${attempt} failed:`,
        (error as Error).message,
      );
      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, 1000 * attempt));
      }
    }
  }

  if (
    lastError instanceof Error &&
    (lastError.name === "AbortError" || lastError.message.includes("aborted"))
  ) {
    throw new Error("Deepgram job submission timed out after 40 seconds");
  }

  if (
    lastError instanceof Error &&
    lastError.message.includes("Non-retriable")
  ) {
    throw lastError;
  }

  console.error("Deepgram submission error:", lastError);
  throw lastError;
}

// ─── Submit raw bytes job via REST API (synchronous) ─────────────────────────
// Use this for file uploads where signed URLs are unreliable.

export async function submitBytesTranscriptionJob(
  blob: Blob,
  options: DeepgramOptions = {},
): Promise<DeepgramResult> {
  const params = buildParams(options);

  // callbackUrl is ignored for sync requests — Deepgram returns results inline
  if (options.callbackUrl) {
    console.warn(
      "submitBytesTranscriptionJob: callbackUrl is ignored for synchronous byte uploads",
    );
  }

  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === true) {
      queryParams.append(key, "true");
    } else if (value === false) {
      continue;
    } else if (Array.isArray(value)) {
      for (const item of value) {
        queryParams.append(key, item);
      }
    } else if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  }

  const apiUrl = `https://api.deepgram.com/v1/listen?${queryParams.toString()}`;

  // ─── Byte diagnostics ───────────────────────────────────────────────────
  try {
    const slice = blob.slice(0, 8);
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const hex = Array.from(bytes)
      .map((b) => "0x" + b.toString(16).padStart(2, "0"))
      .join(" ");
    console.log(
      "Deepgram upload byte signature:",
      hex,
      "| size:",
      blob.size,
      "| declared type:",
      blob.type || "audio/mpeg",
    );
  } catch (e) {
    console.warn("Could not log byte signature:", e);
  }
  // ───────────────────────────────────────────────────────────────────────

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s — just under Vercel 60s

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": blob.type || "audio/mpeg",
      },
      body: blob,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deepgram API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("RAW DEEPGRAM RESPONSE:", JSON.stringify(data, null, 2));
    return parseDeepgramResponse(data);
  } catch (error) {
    clearTimeout(timeoutId);
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"))
    ) {
      throw new Error(
        "Deepgram transcription timed out after 55 seconds (file may be too large for sync upload)",
      );
    }
    throw error;
  }
}

// ─── Params builder ───────────────────────────────────────────────────────────

function buildParams(options: DeepgramOptions): Record<string, any> {
  const { speakerCount = "auto", domain = "general" } = options;

  const domainModelMap: Record<string, string> = {
    medical: "nova-3-medical",
    general: "nova-3",
    legal: "nova-3",
    tech: "nova-3",
    academic: "nova-3",
  };

  return {
    model: domainModelMap[domain] ?? "nova-3",
    smart_format: true,
    punctuate: true,
    paragraphs: true,
    utterances: true,
    diarize: speakerCount !== "1",
    detect_language: true,
  };
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
