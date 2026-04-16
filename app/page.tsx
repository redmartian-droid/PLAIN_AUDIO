import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Mic,
  FileText,
  Zap,
  Globe,
  Lock,
  Download,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  const features = [
    {
      icon: Mic,
      title: "Any audio or video",
      desc: "MP3, WAV, MP4, MOV, WebM — if it has sound, Kungwi can transcribe it.",
    },
    {
      icon: Zap,
      title: "Gemini-powered accuracy",
      desc: "Google's latest AI understands accents, dialects, and technical language.",
    },
    {
      icon: Globe,
      title: "100+ languages",
      desc: "Automatic language detection. Transcribe in any language spoken on earth.",
    },
    {
      icon: FileText,
      title: "Rich exports",
      desc: "Download your transcript as TXT, SRT subtitles, or a clean PDF.",
    },
    {
      icon: Lock,
      title: "Private by default",
      desc: "Your files are encrypted and only accessible to you.",
    },
    {
      icon: Download,
      title: "Timestamps & speakers",
      desc: "Every word is timestamped. Multiple speakers are automatically labelled.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight text-ink"
          >
            Kung<span className="text-amber">wi</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-mist hover:text-ink transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 bg-ink text-surface text-sm font-medium px-4 py-2 rounded-full hover:bg-ink-soft transition-colors"
            >
              Get started
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="dot-grid max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-light text-amber-dark text-xs font-semibold px-3 py-1.5 rounded-full mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
            Powered by Google Gemini 2.0
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-ink leading-[1.08] tracking-tight mb-6 animate-fade-up">
            Your words,
            <br />
            <span className="text-amber italic">perfectly captured.</span>
          </h1>

          <p className="text-lg text-mist max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up [animation-delay:80ms]">
            Kungwi turns any audio or video into accurate, searchable
            transcripts in minutes. Built for clarity, speed, and the way you
            actually work.
          </p>

          <div className="flex items-center justify-center gap-3 animate-fade-up [animation-delay:160ms]">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-amber text-ink font-semibold px-6 py-3 rounded-full hover:bg-amber-dark transition-all hover:shadow-lg hover:shadow-amber/20 hover:-translate-y-0.5"
            >
              Start for free
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="text-sm text-ink-soft hover:text-ink font-medium px-4 py-3 transition-colors"
            >
              Sign in →
            </Link>
          </div>

          <p className="mt-4 text-xs text-mist-light animate-fade-up [animation-delay:220ms]">
            3 free transcriptions per day · No credit card required
          </p>
        </section>

        {/* Mock UI Preview */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
            <div className="bg-ink/4 border-b border-border px-4 py-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-mist font-medium">
                Dashboard · Kungwi
              </span>
            </div>
            <div className="p-8">
              <div className="flex gap-6">
                {/* Sidebar preview */}
                <div className="w-44 shrink-0 space-y-1">
                  <div className="h-3 w-20 rounded shimmer mb-4" />
                  {["Recent", "Folders", "Settings"].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-light/50 cursor-default"
                    >
                      <div className="w-3 h-3 rounded shimmer" />
                      <span className="text-xs text-mist">{item}</span>
                    </div>
                  ))}
                </div>
                {/* Content preview */}
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 rounded shimmer" />
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background/50"
                    >
                      <div className="w-8 h-8 rounded-lg shimmer shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-48 rounded shimmer" />
                        <div className="h-2.5 w-24 rounded shimmer" />
                      </div>
                      <div className="h-6 w-16 rounded-full shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-ink mb-3">
              Everything you need
            </h2>
            <p className="text-mist">
              Professional transcription without the complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-2xl border border-border bg-surface hover:border-amber/30 hover:shadow-soft transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-light flex items-center justify-center mb-4 group-hover:bg-amber/10 transition-colors">
                  <f.icon size={16} className="text-amber" />
                </div>
                <h3 className="font-semibold text-ink text-sm mb-1.5">
                  {f.title}
                </h3>
                <p className="text-mist text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm font-bold text-ink">
            Kung<span className="text-amber">wi</span>
          </span>
          <p className="text-xs text-mist-light">
            © 2026 Kungwi. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
