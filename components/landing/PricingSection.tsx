"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const B = "#D63558";

const FREE_FEATURES = [
  { text: "3 transcriptions per day", included: true },
  { text: "25MB file limit", included: true },
  { text: "TXT export", included: true },
  { text: "7-day storage", included: true },
  { text: "Speaker diarization", included: false },
  { text: "AI summaries", included: false },
  { text: "SRT & DOC export", included: false },
  { text: "Priority processing", included: false },
];

const PRO_FEATURES = [
  { text: "Unlimited transcriptions" },
  { text: "500MB file limit" },
  { text: "TXT, SRT & DOC export" },
  { text: "Permanent storage" },
  { text: "Speaker diarization" },
  { text: "AI summaries" },
  { text: "100+ languages" },
  { text: "Priority processing" },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Billing toggle */}
      <div className="flex items-center justify-center mb-10">
        <div className="inline-flex items-center gap-1 bg-[#0D0D0D]/[0.04] rounded-full p-1">
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              !annual
                ? "bg-white text-[#0D0D0D] shadow-sm"
                : "text-[#999] hover:text-[#0D0D0D]",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
              annual
                ? "bg-white text-[#0D0D0D] shadow-sm"
                : "text-[#999] hover:text-[#0D0D0D]",
            )}
          >
            Annual
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#0D0D0D] text-white">
              Save 31%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Free ── */}
        <div className="rounded-2xl border border-[#E2E0DB] bg-white p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3 text-[#999] font-mono">
              Free
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-semibold tracking-tight text-[#0D0D0D]">
                $0
              </span>
              <span className="text-[#999] text-sm">/ month</span>
            </div>
            <p className="text-[#999] text-sm mt-2">For getting started.</p>
          </div>

          <Link
            href="/signup"
            className="block w-full text-center py-2.5 rounded-2xl border border-[#E2E0DB] text-sm font-semibold text-[#0D0D0D] hover:bg-[#F8F7F4] transition-colors mb-8"
          >
            Get started free
          </Link>

          <ul className="space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                {f.included ? (
                  <Check
                    size={14}
                    className="shrink-0 text-[#0D0D0D]"
                    strokeWidth={2.5}
                  />
                ) : (
                  <Minus
                    size={14}
                    className="text-[#ccc] shrink-0"
                    strokeWidth={2}
                  />
                )}
                <span
                  className={cn(
                    "text-sm",
                    f.included ? "text-[#333]" : "text-[#bbb]",
                  )}
                >
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Pro ── */}
        <div className="rounded-2xl border border-[#0D0D0D] bg-[#0D0D0D] p-8 relative overflow-hidden shadow-2xl shadow-black/10">
          {/* Dot texture — reduced to near-invisible */}
          <div
            className="absolute inset-0 opacity-[0.015] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative mb-8">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold tracking-widest uppercase text-white/50 font-mono">
                Pro
              </p>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">
                Most popular
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-semibold tracking-tight text-white">
                {annual ? "$8" : "$12"}
              </span>
              <span className="text-white/40 text-sm">/ month</span>
            </div>

            {annual && (
              <p className="text-white/50 text-xs mt-1">$99 billed annually</p>
            )}
            <p className="text-white/50 text-sm mt-2">
              For work that can't afford gaps.
            </p>
          </div>

          {/* CTA — accent reserved for action only */}
          <Link
            href="/signup"
            className="relative block w-full text-center py-2.5 rounded-2xl text-white text-sm font-semibold transition-colors duration-200 mb-8 hover:bg-[#B8294A]"
            style={{ backgroundColor: B }}
          >
            Start with Pro
          </Link>

          <ul className="relative space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <Check
                  size={14}
                  className="shrink-0 text-white/50"
                  strokeWidth={2.5}
                />
                <span className="text-sm text-white/75">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-center text-xs mt-6 text-[#999] font-mono">
        No credit card required for free plan · Cancel anytime
      </p>
    </div>
  );
}
