// lib/youtube-transcript.ts
// Pulls YouTube's native caption track (the same data that powers
// the "Show transcript" panel). Falls back to Gemini if unavailable.

// Validate API key at module load
if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY environment variable is not set");
}

export interface YoutubeSegment {
  start: number;
  end: number;
  text: string;
}

export interface YoutubeTranscriptResult {
  segments: YoutubeSegment[];
  fullText: string;
  language: string;
  durationSeconds: number;
  wordCount: number;
  source: "captions" | "gemini";
}

// ─── Extract video ID ─────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("?")[0];
    }
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

// ─── Fetch caption track from YouTube's internal timedtext endpoint ───────────
// FIXED: Returns the language code from the selected track.

async function fetchYoutubeCaptions(
  videoId: string,
  preferredLang = "en",
): Promise<{ segments: YoutubeSegment[]; language: string } | null> {
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!pageRes.ok) return null;

    const html = await pageRes.text();

    // SECURITY: Guard against ReDoS and memory exhaustion on large pages
    if (html.length > 5_000_000) {
      console.warn("YouTube page HTML exceeds size limit");
      return null;
    }

    // Robust extraction via ytInitialPlayerResponse — survives minification changes
    // Using lazy quantifier to prevent catastrophic backtracking
    const playerResponseMatch = html.match(
      /ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});/,
    );
    if (!playerResponseMatch) return null;

    let playerResponse: any;
    try {
      playerResponse = JSON.parse(playerResponseMatch[1]);
    } catch {
      return null;
    }

    const captionTracks: any[] =
      playerResponse?.captions?.playerCaptionsTracklistRenderer
        ?.captionTracks || [];

    if (!captionTracks.length) return null;

    // Prefer requested language, then English, then first available
    const track =
      captionTracks.find((t: any) => t.languageCode === preferredLang) ||
      captionTracks.find((t: any) => t.languageCode === "en") ||
      captionTracks[0];

    if (!track?.baseUrl) return null;

    // SECURITY: Validate baseUrl is from YouTube's timedtext service
    try {
      const baseUrlObj = new URL(track.baseUrl);
      const validHosts = [
        "timedtext.youtube.com",
        "timedtext-pa.googleapis.com",
      ];
      if (!validHosts.some((host) => baseUrlObj.hostname === host)) {
        console.error(`Untrusted caption URL hostname: ${baseUrlObj.hostname}`);
        return null;
      }
    } catch {
      console.error("Failed to parse baseUrl");
      return null;
    }

    const detectedLang = track.languageCode || "en";

    const captionRes = await fetch(`${track.baseUrl}&fmt=json3`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!captionRes.ok) return null;

    const rawCaptionText = await captionRes.text();

    if (!rawCaptionText || rawCaptionText.trim().length === 0) {
      return null;
    }

    let captionData: any;
    try {
      captionData = JSON.parse(rawCaptionText);
    } catch (err) {
      console.error(
        "Failed to parse YouTube caption JSON:",
        rawCaptionText.slice(0, 300),
      );
      return null;
    }

    const events: any[] = captionData?.events || [];

    const segments: YoutubeSegment[] = [];

    for (const event of events) {
      if (!event.segs || event.tStartMs == null) continue;

      const text = event.segs
        .map((s: any) => s.utf8 || "")
        .join("")
        .replace(/\s+/g, " ")
        .trim();

      if (!text || text === " ") continue;

      const startSec = event.tStartMs / 1000;
      const durationSec = (event.dDurationMs ?? 2000) / 1000;

      segments.push({
        start: parseFloat(startSec.toFixed(2)),
        end: parseFloat((startSec + durationSec).toFixed(2)),
        text,
      });
    }

    if (segments.length === 0) return null;

    // Guard: some auto-generated tracks return empty timing shells
    const fullText = segments.map((s) => s.text).join(" ");
    if (fullText.trim().length === 0) return null;

    return { segments, language: detectedLang };
  } catch (err) {
    console.error("YouTube caption fetch error:", err);
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function transcribeYouTube(
  url: string,
  geminiFallback: (url: string) => Promise<any>,
): Promise<YoutubeTranscriptResult> {
  const videoId = extractVideoId(url);

  if (videoId) {
    const captionData = await fetchYoutubeCaptions(videoId);

    if (captionData && captionData.segments.length > 0) {
      const fullText = captionData.segments.map((s) => s.text).join(" ");
      const durationSeconds =
        captionData.segments.length > 0
          ? Math.round(
              captionData.segments[captionData.segments.length - 1].end,
            )
          : 0;

      return {
        segments: captionData.segments,
        fullText,
        language: captionData.language, // ← FIXED: actual track language
        durationSeconds,
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
        source: "captions",
      };
    }
  }

  // No captions available — fall back to Gemini
  console.log("No YouTube captions found, falling back to Gemini");
  const geminiResult = await geminiFallback(url);

  return {
    ...geminiResult,
    source: "gemini" as const,
  };
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS for YouTube
    if (parsed.protocol !== "https:") return false;
    // Check valid YouTube hostnames
    return /^(www\.)?youtube\.com$/.test(parsed.hostname) ||
      parsed.hostname === "youtu.be"
      ? true
      : false;
  } catch {
    return false;
  }
}
