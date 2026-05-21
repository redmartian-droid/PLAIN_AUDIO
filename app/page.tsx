import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { LandingUploadZone } from "@/components/landing/LandingUploadZone";
import { PricingSection } from "@/components/landing/PricingSection";
import { BlogPreview } from "@/components/landing/BlogPreview";

const USE_CASES = [
  {
    role: "Researchers",
    desc: "Turn hours of interviews into searchable, labeled transcripts — no note-taking during the session.",
  },
  {
    role: "Podcast editors",
    desc: "Get a full script with speaker names before you open your DAW. Cut by reading, not by listening.",
  },
  {
    role: "Consultants",
    desc: "Every client call documented automatically. Quotes pulled, context preserved, nothing lost.",
  },
  {
    role: "Journalists",
    desc: "Record your source, upload the file, write from the transcript. Interviews done in half the time.",
  },
  {
    role: "Students",
    desc: "Lectures, seminars, study groups — transcribed with timestamps so you can review what matters.",
  },
  {
    role: "Legal & compliance",
    desc: "Accurate records of meetings and depositions, exported in the format your workflow needs.",
  },
];

const BANNER_1_ITEMS = [
  "system online",
  "queue idle",
  "processing latency: low",
  "input module ready",
  "transcription engine stable",
];

const BANNER_2_ITEMS = [
  "no configuration required",
  "audio normalization active",
  "speaker segmentation enabled",
  "export formats ready",
];

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white text-[#111] antialiased selection:bg-[#f5f5f5]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes scroll {
              from { transform: translateX(0%); }
              to { transform: translateX(-50%); }
            }
            .animate-scroll-slow {
              animation: scroll 30s linear infinite;
            }
            .animate-scroll-medium {
              animation: scroll 20s linear infinite;
            }
          `,
        }}
      />

      <Header />

      {/* SYSTEM RAIL — lowered so content sections paint over it naturally */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-6 z-10 pointer-events-none">
        {["system", "ingest", "process", "export"].map((label) => (
          <span
            key={label}
            className="text-[9px] font-mono tracking-[0.25em] text-[#d0d0d0] uppercase [writing-mode:vertical-rl] [transform:rotate(180deg)]"
          >
            {label}
          </span>
        ))}
      </div>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-24 md:pt-32 pb-28">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#aaa] mb-8">
              AI transcription platform
            </p>

            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-normal tracking-tight leading-[1.1] mb-8">
              Audio input{" "}
              <span className="text-[#ccc]">→ structured output</span>
            </h1>

            <p className="text-base text-[#888] max-w-md leading-[1.7] mb-12">
              Queued for transcription. Speaker labels, timestamps, and export
              formats ready on completion.
            </p>

            <div className="flex items-center gap-6 text-[11px] text-[#bbb] tracking-wide uppercase">
              <span>No credit card</span>
              <span className="text-[#e5e5e5]">/</span>
              <span>3 free daily</span>
              <span className="text-[#e5e5e5]">/</span>
              <span>Fast processing</span>
            </div>
          </div>

          <div className="md:col-span-5 md:pl-8 md:-mt-2">
            <LandingUploadZone />
          </div>
        </div>
      </section>

      {/* BANNER 1 — z-20 covers the rail, stays below header */}
      <section className="relative z-20 bg-white border-t border-[#f0f0f0] overflow-hidden">
        <div className="whitespace-nowrap flex w-max gap-10 py-4 text-[10px] font-mono tracking-widest text-[#c7c7c7] animate-scroll-medium will-change-transform">
          {[...BANNER_1_ITEMS, ...BANNER_1_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-10 shrink-0">
              <span>{item}</span>
              <span>·</span>
            </span>
          ))}
        </div>
      </section>

      {/* CONTEXT STRIP */}
      <section className="border-t border-[#f0f0f0]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-[11px] text-[#bbb] tracking-wide">
            Works with meetings, lectures, interviews, podcasts, and voice notes
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-40">
        <div className="grid md:grid-cols-12 gap-16 mb-32">
          <div className="md:col-span-4 md:sticky md:top-32 self-start">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#aaa] mb-6">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-normal tracking-tight leading-[1.15]">
              Everything you need in a transcript
            </h2>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <div className="divide-y divide-[#f5f5f5]">
              {[
                {
                  num: "01",
                  title: "Upload anything",
                  desc: "MP3, MP4, WAV, M4A — drop your file as-is. No converting, no compressing first.",
                },
                {
                  num: "02",
                  title: "Accuracy you won't have to fix",
                  desc: "Handles accents, background noise, and overlapping speech without manual correction.",
                },
                {
                  num: "03",
                  title: "Know who said what",
                  desc: "Speakers are automatically separated and labeled so you never lose track of a voice.",
                },
                {
                  num: "04",
                  title: "Works in any language",
                  desc: "No setup needed. Speak, upload, and get a transcript — regardless of language.",
                },
                {
                  num: "05",
                  title: "Jump to any moment",
                  desc: "Every line links to its exact timestamp so you can skip straight to what matters.",
                },
                {
                  num: "06",
                  title: "Use it wherever you work",
                  desc: "Export as TXT for notes, SRT for subtitles, or DOC to drop into your workflow.",
                },
              ].map((f) => (
                <div key={f.num} className="py-10 first:pt-0 last:pb-0 group">
                  <div className="flex items-baseline gap-6 mb-3">
                    <span className="text-[10px] font-mono text-[#ddd] tracking-wider">
                      {f.num}
                    </span>
                    <h3 className="text-lg font-normal text-[#111]">
                      {f.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[#999] leading-[1.8] pl-12 max-w-sm">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-[#f0f0f0]">
        <div className="max-w-6xl mx-auto px-6 py-40">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#aaa] mb-20">
            Workflow
          </p>

          <div className="grid md:grid-cols-3 gap-16">
            {[
              {
                step: "01",
                title: "Upload",
                desc: "Drop an audio or video file into the platform.",
              },
              {
                step: "02",
                title: "Process",
                desc: "We transcribe it using AI with timestamps and structure.",
              },
              {
                step: "03",
                title: "Export",
                desc: "Download or copy your transcript instantly.",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i !== 2 && (
                  <div className="hidden md:block absolute top-2 right-0 w-px h-full bg-[#f0f0f0] translate-x-8" />
                )}
                <p className="text-[10px] font-mono text-[#ddd] tracking-wider mb-6">
                  {s.step}
                </p>
                <h3 className="text-lg font-normal mb-3">{s.title}</h3>
                <p className="text-sm text-[#999] leading-[1.8]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-t border-[#f0f0f0]">
        <div className="max-w-6xl mx-auto px-6 py-40">
          <div className="grid md:grid-cols-12 gap-16 mb-24">
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#aaa] mb-6">
                Use cases
              </p>
              <h2 className="text-3xl md:text-4xl font-normal tracking-tight leading-[1.15]">
                Built for anyone who works with audio
              </h2>
            </div>
            <div className="md:col-span-5 md:col-start-8 self-end">
              <p className="text-sm text-[#999] leading-[1.8]">
                If you record it, PLAIN can transcribe it.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20">
            {USE_CASES.map((u) => (
              <div key={u.role} className="group">
                <p className="text-sm font-normal text-[#111] mb-3 tracking-tight">
                  {u.role}
                </p>
                <p className="text-sm text-[#999] leading-[1.8]">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-[#f0f0f0]">
        <div className="max-w-6xl mx-auto px-6 py-40">
          <div className="grid md:grid-cols-12 gap-16 mb-24">
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#aaa] mb-6">
                Pricing
              </p>
              <h2 className="text-3xl md:text-4xl font-normal tracking-tight leading-[1.15]">
                Simple pricing
              </h2>
            </div>
            <div className="md:col-span-5 md:col-start-8 self-end">
              <p className="text-sm text-[#999] leading-[1.8]">
                Start free. Upgrade when you need more.
              </p>
            </div>
          </div>
          <PricingSection />
        </div>
      </section>

      <BlogPreview />

      {/* BANNER 2 */}
      <section className="relative z-20 bg-white border-t border-[#f0f0f0] overflow-hidden">
        <div className="whitespace-nowrap flex w-max gap-10 py-3 text-[10px] font-mono tracking-widest text-[#d0d0d0] animate-scroll-slow will-change-transform">
          {[...BANNER_2_ITEMS, ...BANNER_2_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-10 shrink-0">
              <span>{item}</span>
              <span>·</span>
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#f0f0f0] bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6 py-40">
          <div className="grid md:grid-cols-12 gap-16 items-end">
            <div className="md:col-span-7">
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-normal tracking-tight leading-[1.1] mb-8">
                Start transcribing
                <br />
                <span className="text-[#ccc]">in seconds</span>
              </h2>
              <p className="text-sm text-[#999] leading-[1.8] max-w-md">
                Try it for free. No credit card required. Upgrade when you need
                more.
              </p>
            </div>

            <div className="md:col-span-4 md:col-start-9">
              <Link
                href="/signup"
                className="inline-flex items-center gap-3 border border-[#dcdcdc] bg-white px-8 py-4 text-sm font-mono tracking-wide rounded-2xl hover:border-[#111] active:scale-[0.98] transition-all duration-300"
              >
                execute transcription
                <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#f0f0f0] py-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-baseline gap-8 text-[11px] text-[#bbb] tracking-wide">
          <span className="font-normal text-[#111]">PLAIN</span>

          <div className="flex gap-10">
            <Link href="/blog" className="hover:text-[#111] transition-colors">
              Blog
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[#111] transition-colors"
            >
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#111] transition-colors">
              Terms
            </Link>
          </div>

          <span className="font-mono text-[10px]">© 2026</span>
        </div>
      </footer>
    </div>
  );
}
