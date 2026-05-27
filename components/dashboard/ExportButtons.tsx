"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Download, ChevronDown, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExportButtonsProps {
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
  plan?: "free" | "pro";
}

/* ─── Helpers ─── */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fmtSrt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function fmtReadable(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(String(h));
  parts.push(String(m).padStart(2, "0"));
  parts.push(String(s).padStart(2, "0"));
  return parts.join(":");
}

function toSRT(
  segments: ExportButtonsProps["transcription"]["segments"],
): string {
  if (!segments || segments.length === 0) return "";
  return segments
    .map((seg, i) => {
      const cleanText = seg.text.trim().replace(/\r?\n/g, " ");
      return `${i + 1}\n${fmtSrt(seg.start)} --> ${fmtSrt(seg.end)}\n${cleanText}\n`;
    })
    .join("\n");
}

function fmtVtt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function toVTT(
  segments: ExportButtonsProps["transcription"]["segments"],
): string {
  if (!segments || segments.length === 0) return "WEBVTT\n\n";
  const cues = segments
    .map((seg, i) => {
      const cleanText = seg.text.trim().replace(/\r?\n/g, " ");
      return `${i + 1}\n${fmtVtt(seg.start)} --> ${fmtVtt(seg.end)}\n${cleanText}`;
    })
    .join("\n\n");
  return `WEBVTT\n\n${cues}\n`;
}

function toDocument(
  transcription: ExportButtonsProps["transcription"],
): string {
  const { title, segments, full_text } = transcription;

  const header = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.15;color:#000;max-width:816px;margin:2em auto;padding:0 2em;}
h1{font-size:18pt;font-weight:normal;margin-bottom:6pt;color:#000;}
.sub{color:#666;font-size:10pt;margin-bottom:24pt;}
.speaker{font-weight:bold;color:#1a1a1a;}
.time{color:#999;font-size:9pt;margin-right:6pt;}
p{margin:0 0 8pt 0;}
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p class="sub">Exported from PLAIN</p>`;

  let body: string;
  if (segments && segments.length > 0) {
    body = segments
      .map((seg) => {
        const speakerHtml = seg.speaker
          ? `<span class="speaker">${escapeHtml(seg.speaker)}:</span> `
          : "";
        return `<p><span class="time">${fmtReadable(seg.start)}</span>${speakerHtml}${escapeHtml(seg.text)}</p>`;
      })
      .join("\n");
  } else {
    const paragraphs = (full_text || "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    body =
      paragraphs.length > 0
        ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n")
        : `<p>${escapeHtml(full_text || "")}</p>`;
  }

  return header + "\n" + body + "\n</body></html>";
}

/* ─── Component ─── */

export function ExportButtons({
  transcription,
  plan = "free",
}: ExportButtonsProps) {
  const [open, setOpen] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      // Focus first unlocked item
      requestAnimationFrame(() => {
        const first = itemRefs.current.find(Boolean);
        first?.focus();
      });
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
        const current = document.activeElement;
        const idx = items.indexOf(current as HTMLButtonElement);
        const next =
          e.key === "ArrowDown"
            ? (idx + 1) % items.length
            : (idx - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const download = useCallback(
    (content: string, filename: string, type: string) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setJustDone(true);
      if (doneTimer.current) clearTimeout(doneTimer.current);
      doneTimer.current = setTimeout(() => setJustDone(false), 1500);
    },
    [],
  );

  const slug = transcription.title.replace(/\s+/g, "_").toLowerCase();
  const isPro = plan === "pro";

  const options = [
    {
      label: "Plain text",
      detail: ".txt",
      pro: false,
      action: () =>
        download(transcription.full_text || "", `${slug}.txt`, "text/plain"),
    },
    {
      label: "WebVTT subtitles",
      detail: ".vtt",
      pro: false,
      action: () =>
        download(toVTT(transcription.segments), `${slug}.vtt`, "text/vtt"),
    },
    {
      label: "SRT subtitles",
      detail: ".srt",
      pro: true,
      action: () =>
        download(toSRT(transcription.segments), `${slug}.srt`, "text/plain"),
    },
    {
      label: "Document",
      detail: ".doc",
      pro: true,
      action: () =>
        download(
          toDocument(transcription),
          `${slug}.doc`,
          "application/msword",
        ),
    },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="export-menu"
        aria-label="Export"
        className={cn(
          "inline-flex items-center justify-center gap-2 shrink-0",
          "size-11 sm:min-h-[44px] sm:w-auto sm:px-4",
          "bg-[#D63558] text-white font-semibold rounded-xl text-sm",
          "[transition:background-color_150ms_ease,box-shadow_150ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1)]",
          "hover:bg-[#D63558]/80 hover:shadow-md hover:-translate-y-0.5",
          "active:scale-[.97] active:shadow-none active:translate-y-0",
        )}
      >
        {justDone ? (
          <Check
            size={17}
            aria-hidden
            className="[transition:opacity_200ms_ease]"
          />
        ) : (
          <Download
            size={17}
            aria-hidden
            className="[transition:opacity_200ms_ease]"
          />
        )}
        <span className="hidden sm:inline">Export</span>
        <ChevronDown
          size={14}
          aria-hidden
          className={cn(
            "hidden sm:block",
            "[transition:transform_250ms_cubic-bezier(.34,1.56,.64,1)]",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          id="export-menu"
          role="menu"
          aria-label="Export format"
          className={cn(
            "absolute right-0 top-full mt-2 z-20",
            "bg-card border border-border rounded-xl shadow-lg",
            "py-1 min-w-[196px]",
            "origin-top-right",
            "animate-in fade-in-0 zoom-in-95 duration-200",
          )}
        >
          {options.map((opt, i) => {
            const locked = opt.pro && !isPro;
            return (
              <button
                key={opt.label}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                role="menuitem"
                disabled={locked}
                onClick={
                  locked
                    ? undefined
                    : () => {
                        setOpen(false);
                        opt.action();
                      }
                }
                className={cn(
                  "w-full text-left min-h-[44px] flex items-center justify-between",
                  "px-4 gap-3",
                  "text-sm font-medium",
                  "transition-colors duration-150",
                  locked
                    ? "opacity-40 cursor-not-allowed text-muted-foreground"
                    : [
                        "text-muted-foreground hover:bg-accent hover:text-foreground",
                        "active:bg-accent/70",
                        "focus-visible:outline-none focus-visible:bg-accent focus-visible:text-foreground",
                      ],
                )}
              >
                <span>
                  {opt.label}
                  <span className="text-xs text-muted-foreground/60 ml-1 font-normal">
                    {opt.detail}
                  </span>
                </span>
                {locked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide text-[#D63558]/70">
                    <Lock size={9} strokeWidth={2.5} />
                    Pro
                  </span>
                )}
              </button>
            );
          })}

          {!isPro && (
            <div className="mx-2 mt-1 mb-1.5 pt-1.5 border-t border-border/50">
              <a
                href="/dashboard/settings#billing"
                className={cn(
                  "flex items-center justify-center w-full h-8 rounded-lg",
                  "text-[11px] font-semibold text-[#D63558]",
                  "hover:bg-[#D63558]/[0.06] transition-colors duration-150",
                )}
              >
                Upgrade to Pro →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
