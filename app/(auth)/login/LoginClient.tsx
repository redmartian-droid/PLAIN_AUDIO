"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const fromUpload = searchParams.get("from") === "upload";

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
      return;
    }

    router.push(dashboardHref);
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${dashboardHref}`,
      },
    });

    setLoading(false);

    if (error) setError(error.message);
    else setMagicSent(true);
  }

  if (magicSent) {
    return (
      <div className="w-full max-w-sm text-center animate-fade-up">
        <h1 className="text-2xl font-medium">Check your email</h1>
        <p className="text-sm text-stone-500 mt-2">
          We sent a sign-in link to {email}
        </p>
        {fromUpload && (
          <p className="text-xs text-stone-400 mt-2">
            Once you sign in, your transcription will resume automatically.
          </p>
        )}
        <button
          onClick={() => {
            setMagicSent(false);
            setEmail("");
          }}
          className="mt-6 text-sm text-stone-500 hover:text-stone-900"
        >
          Use another email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-medium">
          {fromUpload ? "Continue" : "Welcome back"}
        </h1>
        <p className="text-sm text-stone-500 mt-2">
          {fromUpload
            ? "Sign in to resume your transcription"
            : "Sign in to your workspace"}
        </p>
      </div>

      <div className="flex bg-stone-100 rounded-2xl p-1 mb-8">
        {(["password", "magic"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm transition-colors",
              mode === m ? "bg-white text-black shadow-sm" : "text-stone-500",
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
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border rounded-xl px-4 py-3"
          required
        />

        {mode === "password" && (
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border rounded-xl px-4 py-3 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        )}

        {error && <div className="text-xs text-red-600">{error}</div>}

        <button
          disabled={loading}
          className="w-full bg-black text-white rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              {mode === "password" ? "Sign in" : "Send link"}
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs mt-6 text-stone-500">
        No account?{" "}
        <Link href="/signup" className="underline text-stone-900">
          Create one
        </Link>
      </p>
    </div>
  );
}
