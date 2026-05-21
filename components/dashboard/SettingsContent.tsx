"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Mail,
  Lock,
  CreditCard,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  ExternalLink,
  Crown,
  ChevronDown,
} from "lucide-react";

type Props = {
  user: { id: string; email: string };
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    plan: string | null;
    polar_subscription_id: string | null;
  } | null;
};

const inputClass =
  "w-full px-3 py-2 bg-background border border-border/40 rounded-xl text-sm text-foreground " +
  "placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#C4A484]/60 " +
  "transition-colors duration-75";

const btnClass =
  "inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-[13px] font-medium rounded-xl " +
  "hover:bg-foreground/90 disabled:opacity-40 transition-colors duration-75";

const btnSecondaryClass =
  "inline-flex items-center gap-2 px-4 py-2 bg-card border border-border/40 text-foreground text-[13px] font-medium rounded-xl " +
  "hover:bg-accent/60 disabled:opacity-40 transition-colors duration-75";

export function SettingsContent({ user, profile }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [confirmDel, setConfirmDel] = useState("");
  const [showDanger, setShowDanger] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const notify = (type: "success" | "error", message: string) =>
    setNotice({ type, message });

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024)
      return notify("error", "Avatar must be under 2MB.");
    setIsLoading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: up } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (up) {
      notify("error", "Failed to upload avatar.");
      setIsLoading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase
      .from("profiles")
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setAvatarUrl(url);
    setIsLoading(false);
    notify("success", "Avatar updated.");
    router.refresh();
  };

  const saveName = async () => {
    if (!name.trim()) return notify("error", "Name cannot be empty.");
    if (name.trim() === profile?.full_name) return;
    setIsLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setIsLoading(false);
    error
      ? notify("error", "Failed to update name.")
      : notify("success", "Name saved.");
  };

  const updateEmail = async () => {
    if (!email.trim() || email === user.email) return;
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ email });
    setIsLoading(false);
    error
      ? notify("error", error.message)
      : notify("success", "Confirmation sent to new address.");
  };

  const updatePassword = async () => {
    if (password.length < 8)
      return notify("error", "Password must be at least 8 characters.");
    if (password !== confirmPw)
      return notify("error", "Passwords do not match.");
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) return notify("error", error.message);
    setPassword("");
    setConfirmPw("");
    notify("success", "Password updated.");
  };

  const deleteAccount = async () => {
    if (confirmDel !== "delete my account") return;
    setIsLoading(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      notify("error", data.error || "Failed to delete account.");
      setIsLoading(false);
      return;
    }
    router.push("/");
  };

  const isPro = profile?.plan === "pro";
  const initial = (name || "U").charAt(0).toUpperCase();

  return (
    <>
      {/* Global notice */}
      {notice && (
        <div
          className={cn(
            "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[13px] font-medium border",
            notice.type === "success"
              ? "bg-[var(--success)]/8 text-[var(--success)] border-[var(--success)]/15"
              : "bg-destructive/8 text-destructive border-destructive/15",
          )}
        >
          {notice.type === "success" ? (
            <CheckCircle size={13} />
          ) : (
            <AlertCircle size={13} />
          )}
          {notice.message}
        </div>
      )}

      {/* Profile */}
      <section className="mt-10">
        <h2 className="text-[15px] font-semibold text-foreground">Profile</h2>
        <p className="text-[12px] text-muted-foreground/60 mt-0.5 mb-4">
          Your display name and photo
        </p>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="w-14 h-14 rounded-full overflow-hidden"
              style={{ background: "#f0eeeb" }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span
                    className="block text-lg font-semibold leading-none"
                    style={{ color: "#212121" }}
                  >
                    {initial}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isLoading}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center hover:bg-foreground/80 transition-colors duration-75 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={9} className="animate-spin" />
              ) : (
                <Camera size={9} />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              className={inputClass}
              placeholder="Your name"
            />
            <p className="text-[11px] text-muted-foreground/60 mt-1.5">
              JPG, PNG or GIF · max 2MB
            </p>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="mt-10">
        <h2 className="text-[15px] font-semibold text-foreground">Account</h2>
        <p className="text-[12px] text-muted-foreground/60 mt-0.5 mb-4">
          Login credentials
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <button
              onClick={updateEmail}
              disabled={isLoading || email === user.email}
              className={cn(btnClass, "mt-3")}
            >
              {isLoading && email !== user.email ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Mail size={13} />
              )}
              {isLoading && email !== user.email ? "Updating…" : "Update email"}
            </button>
          </div>
          <div className="pt-4">
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className={inputClass}
            />
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Confirm new password"
              className={cn(inputClass, "mt-2")}
            />
            <button
              onClick={updatePassword}
              disabled={isLoading || !password || !confirmPw}
              className={cn(btnClass, "mt-3")}
            >
              {isLoading && password && confirmPw ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Lock size={13} />
              )}
              {isLoading && password && confirmPw
                ? "Updating…"
                : "Update password"}
            </button>
          </div>
        </div>
      </section>

      {/* Plan */}
      <section className="mt-10">
        <h2 className="text-[15px] font-semibold text-foreground">Plan</h2>
        <p className="text-[12px] text-muted-foreground/60 mt-0.5 mb-4">
          Billing and subscription
        </p>
        <div className="flex items-center justify-between p-4 bg-accent/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[13px] font-medium text-foreground capitalize">
                {isPro ? "Pro plan" : "Free plan"}
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-px">
                {isPro
                  ? "Unlimited transcriptions · 500MB files · SRT exports"
                  : "3 transcriptions/day · 25MB files"}
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center px-[7px] py-[2px] rounded-[4px] text-[10.5px] font-medium tracking-[0.02em] shrink-0"
            style={
              isPro
                ? { background: "#000000", color: "#ffffff" }
                : {
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                  }
            }
          >
            {isPro ? "Pro" : "Free"}
          </span>
        </div>

        {isPro && profile?.polar_subscription_id ? (
          <button
            onClick={() => {
              setIsLoading(true);
              window.location.href = "/api/billing/portal";
            }}
            disabled={isLoading}
            className={cn(btnSecondaryClass, "mt-3")}
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ExternalLink size={13} className="text-muted-foreground/60" />
            )}
            {isLoading ? "Redirecting…" : "Manage subscription"}
          </button>
        ) : !isPro ? (
          <div className="mt-3 p-4 bg-accent/20 rounded-xl space-y-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Upgrade to Pro
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                Unlimited transcriptions, 500MB files, SRT exports and more.
              </p>
            </div>
            <a
              href="/api/billing/checkout"
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-[13px] font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors duration-75"
            >
              From R220/mo →
            </a>
          </div>
        ) : null}
      </section>

      {/* Danger */}
      <section className="mt-10">
        <button
          onClick={() => setShowDanger(!showDanger)}
          className="flex items-center gap-2 text-[13px] text-destructive hover:text-destructive/80 transition-colors duration-75"
        >
          <Trash2 size={13} /> Delete account
          <ChevronDown
            size={13}
            className={cn(
              "transition-transform duration-75",
              showDanger && "rotate-180",
            )}
          />
        </button>
        {showDanger && (
          <div className="mt-4 space-y-4">
            <p className="text-[13px] text-muted-foreground/70 leading-relaxed">
              This permanently removes all your transcriptions, folders, and
              data. It cannot be undone.
            </p>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">
                Type{" "}
                <span className="font-mono text-destructive text-[12px]">
                  delete my account
                </span>{" "}
                to confirm
              </label>
              <input
                type="text"
                value={confirmDel}
                onChange={(e) => setConfirmDel(e.target.value)}
                placeholder="delete my account"
                className="w-full px-3 py-2 bg-background border border-border/40 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-destructive/50 transition-colors duration-75"
              />
            </div>
            <button
              onClick={deleteAccount}
              disabled={isLoading || confirmDel !== "delete my account"}
              className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground text-[13px] font-medium rounded-xl hover:bg-destructive/90 disabled:opacity-40 transition-colors duration-75"
            >
              {isLoading && confirmDel === "delete my account" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              {isLoading && confirmDel === "delete my account"
                ? "Deleting…"
                : "Delete my account"}
            </button>
          </div>
        )}
      </section>
    </>
  );
}
