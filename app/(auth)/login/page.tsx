"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowRight, Loader2, FileAudio } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadPendingMeta } from "@/lib/pending-transcription";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const fromUpload = searchParams.get("from") === "upload";
  const pendingMeta = fromUpload ? loadPendingMeta() : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [magicSent, setMagicSent] = useState(false);

  const dashboardHref = fromUpload
    ? "/dashboard?resumeTranscription=1"
    : "/dashboard";

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(dashboardHref);
      router.refresh();
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}${dashboardHref}`,
      },
    });

    setLoading(false);
    if (error) setError(error.message);
    else setMagicSent(true);
  }

  if (magicSent) {
    return (
      <div className="w-full max-w-sm text-center animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">✉️</span>
        </div>

        <h1 className="font-display text-2xl font-medium text-stone-900 tracking-tight mb-2">
          Check your email
        </h1>

        <p className="text-stone-500 text-sm leading-relaxed">
          We sent a sign-in link to{" "}
          <span className="text-stone-900 font-medium">{email}</span>.
        </p>

        {fromUpload && (
          <p className="text-stone-400 text-xs mt-3">
            Your transcription will continue after sign-in.
          </p>
        )}

        <button
          onClick={() => {
            setMagicSent(false);
            setEmail("");
          }}
          className="mt-6 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Use another email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      {/* Pending file banner */}
      {fromUpload && pendingMeta && (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-8 bg-white border border-stone-200">
          <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
            <FileAudio size={14} className="text-stone-600" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium text-stone-900 tracking-tight">
              Pending upload
            </p>
            <p className="text-xs text-stone-500 truncate">
              {pendingMeta.name}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-medium text-stone-900 tracking-tight mb-2">
          {fromUpload ? "Continue" : "Welcome back"}
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          {fromUpload
            ? "Sign in to resume your transcription"
            : "Sign in to your workspace"}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-stone-100 rounded-2xl p-1 mb-8">
        {(["password", "magic"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "flex-1 text-sm font-medium py-2.5 rounded-xl transition-all",
              mode === m
                ? "bg-white text-stone-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-stone-500 hover:text-stone-700",
            )}
          >
            {m === "password" ? "Password" : "Magic link"}
          </button>
        ))}
      </div>

      <form
        onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}
        className="space-y-5"
      >
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-stone-500 tracking-[0.14em] uppercase">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm
                       text-stone-900 placeholder:text-stone-400
                       focus:outline-none focus:ring-2 focus:ring-stone-100
                       focus:border-stone-400 transition"
          />
        </div>

        {/* Password */}
        {mode === "password" && (
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-stone-500 tracking-[0.14em] uppercase">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 pr-11 text-sm
                           text-stone-900 placeholder:text-stone-400
                           focus:outline-none focus:ring-2 focus:ring-stone-100
                           focus:border-stone-400 transition"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition p-1"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs text-red-700 bg-red-50/50 border border-red-100 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || (mode === "password" && !password)}
          className="w-full flex items-center justify-center gap-2
                     bg-stone-900 text-stone-50 font-medium
                     py-3.5 px-4 rounded-2xl
                     transition-all
                     hover:bg-stone-800
                     active:scale-[0.98]
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              {mode === "password"
                ? fromUpload
                  ? "Sign in & continue"
                  : "Sign in"
                : "Send link"}
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-stone-500 mt-7">
        No account?{" "}
        <Link
          href={fromUpload ? "/signup?from=upload" : "/signup"}
          className="text-stone-900 hover:underline font-medium transition"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
