"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordValid = passwordRules.every((r) => r.test(password));

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordValid) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-amber-light flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🎉</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">
          You&apos;re almost in!
        </h1>
        <p className="text-mist text-sm mb-6">
          We sent a confirmation email to{" "}
          <strong className="text-ink">{email}</strong>. Click the link to
          activate your account.
        </p>
        <Link
          href="/login"
          className="text-sm text-terra hover:text-terra-dark transition-colors font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-ink mb-2">
          Create your account
        </h1>
        <p className="text-mist text-sm">
          Start transcribing for free — no card needed.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        {/* Full name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-ink-soft tracking-wide uppercase">
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            required
            autoComplete="name"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-mist-light focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
          />
        </div>

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

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-ink-soft tracking-wide uppercase">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              autoComplete="new-password"
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

          {/* Password strength */}
          {password.length > 0 && (
            <div className="pt-1 space-y-1.5">
              {passwordRules.map((rule) => {
                const met = rule.test(password);
                return (
                  <div key={rule.label} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${met ? "bg-success" : "bg-border"}`}
                    >
                      {met && (
                        <Check
                          size={10}
                          className="text-white"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <span
                      className={`text-xs transition-colors ${met ? "text-ink-soft" : "text-mist-light"}`}
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
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || !fullName || !passwordValid}
          className="w-full flex items-center justify-center gap-2 bg-ink text-surface font-semibold py-3 px-4 rounded-xl hover:bg-ink-soft transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Create free account
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-mist mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-terra hover:text-terra-dark font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
