"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function SignupClient() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const fromUpload = searchParams.get("from") === "upload";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordValid = passwordRules.every((r) => r.test(password));

  const dashboardHref = fromUpload
    ? "/dashboard?resumeTranscription=1"
    : "/dashboard";

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordValid) return;

    setLoading(true);
    setError(null);

    const sanitizedName = (fullName || "").trim().slice(0, 100);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: sanitizedName },
        emailRedirectTo: `${window.location.origin}${dashboardHref}`,
      },
    });

    setLoading(false);

    if (error) setError(error.message);
    else setSuccess(true);
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center animate-fade-up">
        <h1 className="text-2xl font-medium">You're almost in</h1>
        <p className="text-sm text-stone-500 mt-2">
          Check your email: <span className="text-stone-900">{email}</span>
        </p>
        {fromUpload && (
          <p className="text-xs text-stone-400 mt-2">
            After confirming, you'll be taken straight to your transcription.
          </p>
        )}
        <Link
          href="/login"
          className="text-sm underline mt-6 inline-block text-stone-500 hover:text-stone-900"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-medium">Create account</h1>
        <p className="text-sm text-stone-500 mt-2">
          {fromUpload
            ? "Sign up to continue your transcription"
            : "Get started with your workspace"}
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        <input
          type="text"
          name="fullName"
          autoComplete="name"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border rounded-xl px-4 py-3"
        />

        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-xl px-4 py-3"
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        {password.length > 0 && (
          <div className="text-xs space-y-1.5">
            {passwordRules.map((r) => (
              <div key={r.label} className="flex gap-2 items-center">
                <Check
                  size={12}
                  className={
                    r.test(password) ? "text-green-600" : "text-gray-300"
                  }
                />
                <span
                  className={
                    r.test(password) ? "text-stone-600" : "text-stone-400"
                  }
                >
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-red-600 text-xs">{error}</div>}

        <button
          disabled={loading || !passwordValid}
          className="w-full bg-black text-white rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              Create account
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs mt-6 text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="underline text-stone-900">
          Sign in
        </Link>
      </p>
    </div>
  );
}
