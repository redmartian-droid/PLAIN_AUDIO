"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
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
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMagicSent(true);
    }
  }

  if (magicSent) {
    return (
      <div className="w-full max-w-sm text-center animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-amber-light flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">✉️</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">
          Check your email
        </h1>
        <p className="text-mist text-sm mb-6">
          We sent a sign-in link to{" "}
          <strong className="text-ink">{email}</strong>
        </p>
        <button
          onClick={() => {
            setMagicSent(false);
            setEmail("");
          }}
          className="text-sm text-amber hover:text-amber-dark transition-colors"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-ink mb-2">
          Welcome back
        </h1>
        <p className="text-mist text-sm">Sign in to your Kungwi account</p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-border/40 rounded-xl p-1 mb-6">
        {(["password", "magic"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "flex-1 text-sm font-medium py-2 rounded-lg transition-all",
              mode === m
                ? "bg-surface text-ink shadow-card"
                : "text-mist hover:text-ink",
            )}
          >
            {m === "password" ? "Password" : "Magic link"}
          </button>
        ))}
      </div>

      <form
        onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}
        className="space-y-4"
      >
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-ink-soft tracking-wide uppercase">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-mist-light focus:outline-none focus:ring-2 focus:ring-amber/30 focus:border-amber transition-all"
          />
        </div>

        {/* Password field */}
        {mode === "password" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-ink-soft tracking-wide uppercase">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                autoComplete="current-password"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-11 text-sm text-ink placeholder:text-mist-light focus:outline-none focus:ring-2 focus:ring-amber/30 focus:border-amber transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-ink transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || (mode === "password" && !password)}
          className="w-full flex items-center justify-center gap-2 bg-ink text-surface font-semibold py-3 px-4 rounded-xl hover:bg-ink-soft transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              {mode === "password" ? "Sign in" : "Send magic link"}
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-mist mt-6">
        No account?{" "}
        <Link
          href="/signup"
          className="text-amber hover:text-amber-dark font-medium transition-colors"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}
