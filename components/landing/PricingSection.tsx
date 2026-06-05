"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const PRO_FEATURES = [
  { lead: "Unlimited transcriptions", desc: "with no daily caps" },
  { lead: "Files up to 500MB", desc: "without splitting" },
  { lead: "All export formats", desc: "including TXT, SRT, VTT, and DOC" },
  { lead: "Permanent storage", desc: "for your files" },
  { lead: "Speaker labels", desc: "with automatic diarization" },
  { lead: "AI summaries", desc: "for instant takeaways" },
  { lead: "Priority processing", desc: "to skip the queue" },
];

const FREE_FEATURES = [
  { lead: "5 transcriptions per day", desc: "daily limit", included: true },
  {
    lead: "Files up to 25MB",
    desc: "for short clips and calls",
    included: true,
  },
  { lead: "TXT and VTT exports", desc: "basic formats", included: true },
  { lead: "7-day storage", desc: "temporary access", included: true },
  { lead: "Standard processing", desc: "regular queue", included: true },
  {
    lead: "Speaker labels",
    desc: "with automatic diarization",
    included: false,
  },
  { lead: "AI summaries", desc: "for instant takeaways", included: false },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* ── Toggle ── */}
      <div className="flex justify-center mb-10">
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
            <span className="badge-pill dark">Save $54/yr</span>
          </button>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pro */}
        <div className="pricing-card dark">
          {/* Most popular — sits on the frame */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <span className="badge-popular">Most popular</span>
          </div>

          <div className="relative mb-8">
            <div className="flex items-center gap-2 mb-3">
              <p className="pricing-eyebrow dark">
                <strong>Pro</strong>
              </p>
            </div>

            <div className="price-lockup">
              <span className="price-value dark tabular-nums">
                {annual ? "13.50" : "18"}
              </span>
              <span className="price-period dark">/ mo</span>
            </div>

            {annual ? (
              <p className="price-annual-note">$162/year</p>
            ) : (
              <p className="price-annual-note">&nbsp;</p>
            )}

            <p className="price-caption dark">
              For work that can&apos;t afford gaps.
            </p>
          </div>

          <Link
            href={
              annual
                ? "/api/billing/checkout?interval=annual"
                : "/api/billing/checkout?interval=monthly"
            }
            className="btn-pricing solid hover:bg-primary/90"
          >
            Start with Pro
          </Link>

          <ul className="relative pricing-features">
            {PRO_FEATURES.map((f) => (
              <li key={f.lead} className="pricing-feature">
                <Check
                  size={14}
                  strokeWidth={2.5}
                  className="pricing-feature-icon"
                  style={{ color: "#f43f5e" }}
                />
                <span className="pricing-feature-text dark">
                  <strong>{f.lead}</strong> {f.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Free */}
        <div className="pricing-card light p-8">
          <div className="mb-8">
            <p className="pricing-eyebrow light mb-1">
              <strong>Free</strong>
            </p>
            <p className="price-caption light mb-5">For getting started.</p>

            <div className="price-lockup">
              <span className="price-value light">0</span>
              <span className="price-period light">/ mo</span>
            </div>
            <p className="price-caption light">&nbsp;</p>

            <Link href="/signup" className="btn-pricing outline">
              Get started free
            </Link>
          </div>

          <ul className="pricing-features">
            {FREE_FEATURES.map((f, i) => (
              <li key={f.lead} className="pricing-feature">
                {f.included ? (
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="pricing-feature-icon"
                    style={{ color: i === 0 ? "#f43f5e" : "#f5b8c8" }}
                  />
                ) : (
                  <Minus
                    size={14}
                    strokeWidth={2}
                    className="pricing-feature-icon excluded"
                  />
                )}
                <span
                  className={cn(
                    "pricing-feature-text",
                    f.included ? "included" : "excluded",
                  )}
                >
                  {f.included ? (
                    <>
                      <strong>{f.lead}</strong> {f.desc}
                    </>
                  ) : (
                    f.lead
                  )}
                </span>
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
