import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/polar";
import Link from "next/link";
import { Check } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isPro = profile?.plan === "pro";
  const proProductId = process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID;

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">
          Settings
        </h1>
        <p className="text-mist text-sm">
          Manage your account and subscription.
        </p>
      </div>

      {/* Account */}
      <section className="bg-surface border border-border rounded-2xl p-5 mb-4 animate-fade-up">
        <h2 className="font-semibold text-ink text-sm mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-mist">Name</span>
            <span className="text-sm font-medium text-ink">
              {profile?.full_name || "—"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-mist">Email</span>
            <span className="text-sm font-medium text-ink">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-mist">Plan</span>
            <span
              className={`text-sm font-bold capitalize ${isPro ? "text-terra" : "text-ink"}`}
            >
              {profile?.plan || "free"}
            </span>
          </div>
        </div>
      </section>

      {/* Upgrade section */}
      {!isPro && (
        <section
          id="upgrade"
          className="bg-ink rounded-2xl p-6 mb-4 animate-fade-up [animation-delay:80ms]"
        >
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-terra uppercase tracking-wider">
                ✦ Pro Plan
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-parchment mb-1">
              R220{" "}
              <span className="text-base font-normal text-mist-light">
                /month
              </span>
            </p>
            <p className="text-sm text-mist-light">or R1,800/year — save 30%</p>
          </div>

          <ul className="space-y-2.5 mb-6">
            {PLANS.pro.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2.5 text-sm text-parchment/90"
              >
                <div className="w-4 h-4 rounded-full bg-terra/20 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-terra" strokeWidth={3} />
                </div>
                {f}
              </li>
            ))}
          </ul>

          {proProductId ? (
            <a
              href={`https://polar.sh/checkout?product_id=${proProductId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-terra text-white font-bold py-3 rounded-xl hover:bg-terra-dark transition-colors"
            >
              Upgrade to Pro →
            </a>
          ) : (
            <div className="bg-parchment/10 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-mist-light">
                Payments not yet configured.
              </p>
            </div>
          )}
        </section>
      )}

      {isPro && (
        <section className="bg-terra-light border border-terra/20 rounded-2xl p-5 mb-4 animate-fade-up [animation-delay:80ms]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-terra flex items-center justify-center">
                <span className="text-white text-sm">✦</span>
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">
                  You&apos;re on Pro
                </p>
                <p className="text-xs text-mist">
                  Unlimited transcriptions · All features unlocked
                </p>
              </div>
            </div>
            <a
              href="/api/billing/portal"
              className="text-sm text-terra hover:text-terra-dark font-medium transition-colors whitespace-nowrap ml-4"
            >
              Manage subscription →
            </a>
          </div>
        </section>
      )}

      {/* Danger zone */}
      <section className="border border-red-100 rounded-2xl p-5 animate-fade-up [animation-delay:160ms]">
        <h2 className="font-semibold text-red-600 text-sm mb-4">Danger zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Sign out</p>
            <p className="text-xs text-mist">Sign out from all devices</p>
          </div>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
