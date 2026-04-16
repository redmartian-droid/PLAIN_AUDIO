import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileAudio, Clock, FileText, TrendingUp } from "lucide-react";
import { formatRelativeTime, formatDuration } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: transcriptions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("transcriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const completedCount = transcriptions?.filter((t) => t.status === "completed").length ?? 0;
  const totalWords = transcriptions?.reduce((acc, t) => acc + (t.word_count || 0), 0) ?? 0;
  const totalDuration = transcriptions?.reduce((acc, t) => acc + (t.duration_seconds || 0), 0) ?? 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = (profile?.full_name || user.email || "").split(" ")[0].split("@")[0];

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">
          {greeting()}, {firstName} 👋
        </h1>
        <p className="text-mist text-sm">Here&apos;s what&apos;s been transcribed recently.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 stagger-children">
        {[
          { label: "Total transcriptions", value: completedCount, icon: FileAudio, suffix: "" },
          { label: "Words transcribed", value: totalWords.toLocaleString(), icon: FileText, suffix: "" },
          { label: "Audio processed", value: formatDuration(totalDuration), icon: Clock, suffix: "" },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-mist font-medium">{stat.label}</span>
              <div className="w-7 h-7 rounded-lg bg-parchment flex items-center justify-center">
                <stat.icon size={13} className="text-terra" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Transcriptions */}
      <div className="animate-fade-up [animation-delay:200ms]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">Recent transcriptions</h2>
          <Link
            href="/dashboard/transcriptions"
            className="text-xs text-terra hover:text-terra-dark font-medium transition-colors"
          >
            View all →
          </Link>
        </div>

        {!transcriptions || transcriptions.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-terra-light flex items-center justify-center mx-auto mb-4">
              <FileAudio size={20} className="text-terra" />
            </div>
            <h3 className="font-semibold text-ink mb-1.5">No transcriptions yet</h3>
            <p className="text-sm text-mist mb-5 max-w-xs mx-auto">
              Upload your first audio or video file to get started.
            </p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 bg-terra text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-terra-dark transition-colors"
            >
              <Plus size={14} />
              New transcription
            </Link>
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {transcriptions.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/transcriptions/${t.id}`}
                className="flex items-center gap-4 bg-surface border border-border rounded-xl px-4 py-3.5 hover:border-terra/30 hover:shadow-soft transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-parchment flex items-center justify-center shrink-0 group-hover:bg-terra-light transition-colors">
                  <FileAudio size={15} className="text-mist group-hover:text-terra transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{t.title}</p>
                  <p className="text-xs text-mist">
                    {formatRelativeTime(t.created_at)}
                    {t.duration_seconds ? ` · ${formatDuration(t.duration_seconds)}` : ""}
                    {t.word_count ? ` · ${t.word_count.toLocaleString()} words` : ""}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade CTA for free users */}
      {profile?.plan === "free" && (
        <div className="mt-8 bg-ink rounded-2xl p-6 flex items-center justify-between gap-4 animate-fade-up [animation-delay:300ms]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-terra" />
              <span className="text-xs font-bold text-terra uppercase tracking-wider">Upgrade to Pro</span>
            </div>
            <p className="text-parchment font-semibold text-sm">
              Unlimited transcriptions, 500MB files, SRT exports &amp; more.
            </p>
          </div>
          <Link
            href="/dashboard/settings#upgrade"
            className="shrink-0 bg-terra text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-terra-dark transition-colors whitespace-nowrap"
          >
            From R220/mo →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    completed: "bg-green-50 text-green-700 border-green-100",
    processing: "bg-yellow-50 text-yellow-700 border-yellow-100",
    pending: "bg-gray-50 text-gray-500 border-gray-100",
    failed: "bg-red-50 text-red-600 border-red-100",
  };
  const labels = {
    completed: "Done",
    processing: "Processing",
    pending: "Pending",
    failed: "Failed",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status as keyof typeof styles] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
      {labels[status as keyof typeof labels] ?? status}
    </span>
  );
}
