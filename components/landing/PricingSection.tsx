"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <div className="pricing-toggle">
          <button
            onClick={() => setAnnual(false)}
            className={cn("pricing-toggle-btn", !annual && "active")}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              "pricing-toggle-btn",
              annual && "active",
              "flex items-center gap-2",
            )}
          >
            Annual
            <span className="badge-pill dark">Save 31%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Free ── */}
        <div className="pricing-card light">
          <div className="mb-8">
            <p className="pricing-eyebrow light mb-3">Free</p>
            <div className="price-lockup">
              <span className="price-value light">$0</span>
              <span className="price-period light">/ month</span>
            </div>
            <p className="price-caption light">For getting started.</p>
          </div>

          <Link href="/signup" className="btn-pricing outline">
            Get started free
          </Link>

          <ul className="pricing-features">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className="pricing-feature">
                {f.included ? (
                  <Check
                    size={14}
                    className="pricing-feature-icon included"
                    strokeWidth={2.5}
                  />
                ) : (
                  <Minus
                    size={14}
                    className="pricing-feature-icon excluded"
                    strokeWidth={2}
                  />
                )}
                <span
                  className={cn(
                    "pricing-feature-text",
                    f.included ? "included" : "excluded",
                  )}
                >
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Pro ── */}
        <div className="pricing-card dark">
          <div className="dot-texture" />

          <div className="relative mb-8">
            <div className="flex items-center gap-2 mb-3">
              <p className="pricing-eyebrow dark">Pro</p>
              <span className="badge-pill ghost">Most popular</span>
            </div>

            <div className="price-lockup">
              <span className="price-value dark">{annual ? "$8" : "$12"}</span>
              <span className="price-period dark">/ month</span>
            </div>

            {annual && <p className="price-annual-note">$99 billed annually</p>}
            <p className="price-caption dark">
              For work that can't afford gaps.
            </p>
          </div>

          <Link href="/signup" className="btn-pricing solid">
            Start with Pro
          </Link>

          <ul className="relative pricing-features">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="pricing-feature">
                <Check
                  size={14}
                  className="pricing-feature-icon dark"
                  strokeWidth={2.5}
                />
                <span className="pricing-feature-text dark">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="pricing-footer">
        No credit card required for free plan · Cancel anytime
      </p>
    </div>
  );
}
