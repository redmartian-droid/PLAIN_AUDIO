import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptionSegment[];
  language: string;
  durationSeconds?: number;
  summary?: string;
  wordCount: number;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<TranscriptionResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const audioData = {
    inlineData: {
      data: audioBuffer.toString("base64"),
      mimeType: mimeType,
    },
  };

  const prompt = `You are a professional transcription service. Transcribe the audio file accurately and completely.

Return a JSON object with this exact structure (no markdown, just raw JSON):
{
  "fullText": "complete transcript here",
  "segments": [
    { "start": 0, "end": 5.2, "text": "segment text here", "speaker": "Speaker 1" }
  ],
  "language": "en",
  "summary": "2-3 sentence summary of the content",
  "durationSeconds": 0
}

Rules:
- fullText must be the complete, clean transcript
- segments should have accurate timestamps in seconds
- Detect the language and report its ISO code
- If you can identify different speakers, label them Speaker 1, Speaker 2, etc.
- summary should capture the main points
- Do not add any markdown, only return the JSON object`;

  try {
    const result = await model.generateContent([prompt, audioData]);
    const response = result.response.text();

    // Strip any potential markdown fences
    const clean = response.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      fullText: parsed.fullText || "",
      segments: parsed.segments || [],
      language: parsed.language || "en",
      durationSeconds: parsed.durationSeconds,
      summary: parsed.summary,
      wordCount: (parsed.fullText || "").split(/\s+/).filter(Boolean).length,
    };
  } catch (error) {
    console.error("Gemini transcription error:", error);
    throw new Error("Transcription failed. Please try again.");
  }
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
