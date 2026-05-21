"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Check,
  FileAudio,
} from "lucide-react";
import { loadPendingMeta } from "@/lib/pending-transcription";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const fromUpload = searchParams.get("from") === "upload";
  const pendingMeta = fromUpload ? loadPendingMeta() : null;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordValid = passwordRules.every((r) => r.test(password));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const dashboardHref = fromUpload
    ? `${appUrl}/dashboard?resumeTranscription=1`
    : `${appUrl}/dashboard`;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordValid) return;

    setLoading(true);
    setError(null);

    // Sanitize fullName to prevent stored XSS
    const sanitizedName = (fullName || "").trim().slice(0, 100);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: sanitizedName },
        emailRedirectTo: dashboardHref,
      },
    });

    setLoading(false);
    if (error) setError(error.message);
    else setSuccess(true);
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🎉</span>
        </div>

        <h1 className="font-display text-2xl font-medium text-stone-900 tracking-tight mb-2">
          You're almost in
        </h1>

        <p className="text-stone-500 text-sm leading-relaxed">
          We sent a confirmation link to{" "}
          <span className="text-stone-900 font-medium">{email}</span>.
        </p>

        {fromUpload && pendingMeta && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl px-4 py-3 bg-white border border-stone-200 text-left">
            <FileAudio size={14} className="text-stone-500 mt-0.5 shrink-0" />
            <p className="text-xs text-stone-500 leading-relaxed">
              <span className="text-stone-900 font-medium">
                Your file is safely stored.
              </span>{" "}
              It will begin processing after confirmation.
            </p>
          </div>
        )}

        <Link
          href="/login"
          className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 transition"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      {/* Pending banner */}
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
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-medium text-stone-900 tracking-tight mb-2">
          {fromUpload ? "One step away" : "Create account"}
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          {fromUpload
            ? "Start transcribing instantly after signup"
            : "No card required. Free to start."}
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        {/* Full name */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-stone-500 tracking-[0.14em] uppercase">
            Full name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm
                       text-stone-900 placeholder:text-stone-400
                       focus:outline-none focus:ring-2 focus:ring-stone-100
                       focus:border-stone-400 transition"
          />
        </div>

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
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-stone-500 tracking-[0.14em] uppercase">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
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

          {/* Password rules panel */}
          {password.length > 0 && (
            <div className="mt-2 rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 space-y-2">
              {passwordRules.map((rule) => {
                const met = rule.test(password);
                return (
                  <div key={rule.label} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition
                      ${met ? "bg-stone-800" : "bg-stone-200"}`}
                    >
                      {met && <Check size={10} className="text-white" />}
                    </div>

                    <span
                      className={`text-xs transition
                      ${met ? "text-stone-900" : "text-stone-500"}`}
                    >
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-xs text-red-700 bg-red-50/50 border border-red-100 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || !fullName || !passwordValid}
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
              {fromUpload ? "Create account & continue" : "Create account"}
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-stone-500 mt-7">
        Already have an account?{" "}
        <Link
          href={fromUpload ? "/login?from=upload" : "/login"}
          className="text-stone-900 hover:underline font-medium transition"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
