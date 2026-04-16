"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";

interface ExportButtonsProps {
  transcription: {
    id: string;
    title: string;
    full_text: string;
    segments: Array<{
      start: number;
      end: number;
      text: string;
      speaker?: string;
    }> | null;
  };
}

function toSRT(
  segments: ExportButtonsProps["transcription"]["segments"],
): string {
  if (!segments || segments.length === 0) return "";

  function fmt(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.round((sec % 1) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  }

  return segments
    .map(
      (seg, i) =>
        `${i + 1}\n${fmt(seg.start)} --> ${fmt(seg.end)}\n${seg.text}\n`,
    )
    .join("\n");
}

export function ExportButtons({ transcription }: ExportButtonsProps) {
  const [open, setOpen] = useState(false);

  function download(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  const slug = transcription.title.replace(/\s+/g, "_").toLowerCase();

  const options = [
    {
      label: "Plain text (.txt)",
      action: () =>
        download(transcription.full_text || "", `${slug}.txt`, "text/plain"),
    },
    {
      label: "SRT subtitles (.srt)",
      action: () =>
        download(toSRT(transcription.segments), `${slug}.srt`, "text/plain"),
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-ink text-surface text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-ink-soft transition-colors"
      >
        <Download size={12} />
        Export
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 bg-surface border border-border rounded-xl shadow-modal py-1 w-44 animate-fade-in">
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={opt.action}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-ink-soft hover:bg-surface hover:text-ink transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
