"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "What file formats can I upload?",
    a: "MP3, MP4, WAV, M4A, OGG, and WebM. Drop the file as-is — no converting or compressing required.",
  },
  {
    q: "What's the file size limit?",
    a: "Free accounts can upload files up to 25MB. Pro accounts support files up to 500MB.",
  },
  {
    q: "How many transcriptions do I get for free?",
    a: "3 transcriptions per day on the free plan. Upgrade to Pro for unlimited daily transcriptions.",
  },
  {
    q: "What's the difference between Accurate and Balanced?",
    a: "Accurate uses Deepgram and is best for long recordings, multiple speakers, or anything where precision matters. Balanced uses Gemini and is faster — good for shorter files and solo recordings.",
  },
  {
    q: "Can it tell speakers apart?",
    a: "Yes. Speaker diarization runs automatically when two or more voices are detected. The transcript is grouped and labeled by speaker so you always know who said what.",
  },
  {
    q: "What languages are supported?",
    a: "No configuration needed — PLAIN detects the language automatically. Both models support a wide range of languages out of the box.",
  },
  {
    q: "Can I transcribe a YouTube video?",
    a: "Yes. Paste a YouTube URL instead of uploading a file and PLAIN will handle the rest.",
  },
  {
    q: "What export formats are available?",
    a: "TXT for plain notes, SRT for subtitles, and DOC to paste straight into your workflow.",
  },
  {
    q: "What happens if a transcription fails?",
    a: "The failed job stays in your dashboard with an error message. Hit the retry button on the transcription detail page and it'll reprocess the same file. If it keeps failing, the most common causes are silent audio, unsupported codecs, or a file that's mostly music with no speech.",
  },
  {
    q: "Who can access my recordings?",
    a: "Only you. Files are stored in private Supabase buckets in the EU (eu-west-1), encrypted at rest with AES-256 and in transit with TLS. Row Level Security is enforced on every database table so no other user or query can reach your data. We don't use advertising trackers or behavioral profiling, and you retain full ownership of everything you upload.",
  },
  {
    q: "How long are my files kept?",
    a: "On the free plan, audio files and transcripts are retained for 7 days from upload, then deleted from our systems. On Pro, your files stay until you delete them or close your account.",
  },
  {
    q: "Is my audio stored after transcription?",
    a: "Yes, so you can play it back alongside the transcript. You can delete the audio file at any time from the transcription detail view — or delete your account to remove everything.",
  },
  {
    q: "Can I organise transcriptions into folders?",
    a: "Yes. Create folders from the dashboard and move any transcription into one. Folder names can be up to 100 characters.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="border-t border-[#f0f0f0]">
      <div className="max-w-6xl mx-auto px-6 py-40">
        <div className="grid md:grid-cols-12 gap-16 mb-20">
          <div className="md:col-span-4 md:sticky md:top-32 self-start">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#D63558] mb-6">
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-normal tracking-tight leading-[1.15]">
              Common questions
            </h2>
          </div>

          <div className="md:col-span-7 md:col-start-6 divide-y divide-[#f5f5f5]">
            {FAQS.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="py-6 first:pt-0 last:pb-0">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-start justify-between gap-6 text-left group"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-normal text-[#111] leading-[1.6] group-hover:text-[#555] transition-colors duration-200">
                      {faq.q}
                    </span>
                    <span className="shrink-0 mt-0.5 text-[#ccc] group-hover:text-[#999] transition-colors duration-200">
                      {isOpen ? (
                        <Minus size={13} strokeWidth={1.5} />
                      ) : (
                        <Plus size={13} strokeWidth={1.5} />
                      )}
                    </span>
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isOpen ? "200px" : "0px",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p className="text-sm text-[#999] leading-[1.8] pt-4 max-w-lg">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
