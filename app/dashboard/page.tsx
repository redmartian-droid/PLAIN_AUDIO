import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileAudio, ChevronRight } from "lucide-react";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { FolderIcon } from "@/components/ui/folder-icon";
import { NewTranscriptionButton } from "@/components/dashboard/NewTranscriptionButton";
import { RecentTranscriptionsList } from "@/components/dashboard/RecentTranscriptionsList";
import { DashboardResume } from "@/components/dashboard/DashboardResume";
import { cn } from "@/lib/utils";

const FREE_LIMIT = 5;
const B = "#f43f5e";

const fontSyne = {
  fontFamily: "var(--font-syne,'Helvetica Neue',sans-serif)",
} as const;
const fontMono = {
  fontFamily: "var(--font-mono,'Courier New',monospace)",
} as const;

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Good night";
}

/** Eyebrow label matching the landing page section tags */
function SectionEyebrow({
  label,
  href,
  linkLabel,
}: {
  label: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="section-eyebrow">{label}</p>
      {href && linkLabel && (
        <Link
          href={href}
          className="section-eyebrow text-[#999] hover:text-[#0D0D0D] transition-colors flex items-center gap-1"
        >
          {linkLabel} <ChevronRight size={11} />
        </Link>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: recent },
    { data: allStats },
    { data: recentFolders },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("transcriptions")
      .select(
        "id, title, created_at, status, duration_seconds, word_count, language, clean_text",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("transcriptions")
      .select("status, word_count, duration_seconds")
      .eq("user_id", user.id),
    supabase
      .from("folders")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const isFree = profile?.plan === "free";
  const totalCount = allStats?.length ?? 0;
  const completedCount =
    allStats?.filter((t) => t.status === "completed").length ?? 0;
  const totalDuration =
    allStats?.reduce((acc, t) => acc + (t.duration_seconds || 0), 0) ?? 0;
  const hasTranscribed = completedCount > 0;

  const usagePercent = isFree
    ? Math.min((totalCount / FREE_LIMIT) * 100, 100)
    : 0;
  const remaining = isFree ? Math.max(FREE_LIMIT - totalCount, 0) : null;

  const recentWithPreviews =
    recent?.map((t) => ({
      ...t,
      preview: t.clean_text
        ? t.clean_text.slice(0, 120).trimEnd() +
          (t.clean_text.length > 120 ? "…" : "")
        : undefined,
    })) ?? [];

  const sortedRecent = [...recentWithPreviews].sort((a, b) => {
    const priority = (s: string) =>
      s === "failed" ? 0 : s === "processing" ? 1 : 2;
    return priority(a.status) - priority(b.status);
  });

  const firstName = (profile?.full_name || user.email || "")
    .split(" ")[0]
    .split("@")[0];
  const greeting = getTimeBasedGreeting();
  const hasFolders = (recentFolders?.length ?? 0) > 0;

  return (
    <DashboardResume>
      <div className="flex flex-col h-full pt-14 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 max-w-5xl mx-auto w-full">
        {/* ── Greeting ── */}
        <div className="mb-6 sm:mb-10 animate-fade-up flex flex-row items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h1
              className="mb-1.5"
              style={{
                ...fontSyne,
                fontWeight: 700,
                fontSize: "clamp(1.25rem, 4.5vw, 2.5rem)",
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                color: "#0D0D0D",
              }}
            >
              {greeting}, {firstName}
            </h1>
            <p
              style={{
                ...fontMono,
                fontSize: 11,
                letterSpacing: "0.04em",
                color: "#AAA8A4",
              }}
            >
              {hasTranscribed
                ? `${completedCount} transcription${completedCount !== 1 ? "s" : ""} · ${formatDuration(totalDuration)} processed`
                : "Upload your first file to get started."}
            </p>
          </div>
          <div className="shrink-0">
            <NewTranscriptionButton />
          </div>
        </div>

        {/* ── Free tier usage ── */}
        {isFree && (
          <div
            className="mb-6 sm:mb-10 animate-fade-up rounded-xl p-4 sm:p-5 shrink-0"
            style={{ background: "#fff", border: "1px solid #E2E0DB" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 13, color: "#0D0D0D", fontWeight: 500 }}>
                {remaining === 0
                  ? "You've used all your free transcriptions"
                  : `${totalCount} of ${FREE_LIMIT} free transcriptions used`}
              </span>
              {remaining !== null && remaining > 0 && (
                <span
                  style={{
                    ...fontMono,
                    fontSize: 10.5,
                    color: "#AAA8A4",
                    letterSpacing: "0.04em",
                  }}
                >
                  {remaining} remaining
                </span>
              )}
            </div>

            <div
              className="h-[2px] rounded-full overflow-hidden"
              style={{ background: "#E2E0DB" }}
              role="progressbar"
              aria-valuenow={totalCount}
              aria-valuemin={0}
              aria-valuemax={FREE_LIMIT}
              aria-label="Free transcription usage"
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${usagePercent}%`,
                  background: remaining === 0 ? B : "#0D0D0D",
                  opacity: remaining === 0 ? 1 : 0.3,
                }}
              />
            </div>

            {hasTranscribed && remaining !== null && remaining <= 2 && (
              <p className="mt-3 text-xs" style={{ color: "#AAA8A4" }}>
                {remaining === 0
                  ? "Your files are saved, but you won't be able to add more. "
                  : `${remaining} left. After that, your account is read-only. `}
                <Link
                  href="/api/billing/checkout"
                  className="font-medium hover:underline"
                  style={{ color: B }}
                >
                  Upgrade to keep going →
                </Link>
              </p>
            )}
          </div>
        )}

        {/* ── Folders ── */}
        {hasFolders && (
          <div className="mb-4 sm:mb-6 animate-fade-up [animation-delay:100ms] shrink-0">
            <SectionEyebrow
              label="Folders"
              href="/dashboard/folders"
              linkLabel="View all"
            />

            {/* Mobile: compact rows */}
            <div className="sm:hidden flex flex-col gap-1">
              {recentFolders!.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/dashboard/folders/${folder.id}`}
                  className={cn(
                    "group flex items-center gap-3 min-w-0",
                    "rounded-lg border border-transparent",
                    "py-3 px-4",
                    "transition-[background-color,border-color,transform] duration-[140ms] ease-out",
                    "active:bg-[#EBE9E4] active:scale-[0.985] active:duration-75",
                    "hover:bg-[#F0EEEB]/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  )}
                >
                  <FolderIcon className="w-10 h-10 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[14px] font-medium text-[#0D0D0D] leading-[1.25]">
                      {folder.name}
                    </p>
                    <p
                      className="truncate text-[11px] text-[#AAA8A4] mt-[2px] leading-[1.25]"
                      style={{ ...fontMono }}
                    >
                      {formatRelativeTime(folder.created_at)}
                    </p>
                  </div>

                  <ChevronRight
                    size={14}
                    className="shrink-0 text-muted-foreground/30 transition-opacity duration-150 group-hover:text-muted-foreground/60"
                  />
                </Link>
              ))}
            </div>

            {/* Desktop: horizontal scroll carousel */}
            <div className="hidden sm:flex gap-6 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
              {recentFolders!.map((folder, i) => (
                <Link
                  key={folder.id}
                  href={`/dashboard/folders/${folder.id}`}
                  className={cn(
                    "group flex flex-col items-center text-center relative snap-start shrink-0 w-24",
                    i === 0 && "snap-align-start",
                  )}
                >
                  <div className="relative mb-1.5 transition-transform duration-200 group-active:scale-95 group-hover:scale-105">
                    <FolderIcon className="w-20 h-20 drop-shadow-sm" />
                  </div>
                  <p
                    className="px-1 line-clamp-2 leading-tight text-[12px] min-h-[44px] flex items-center justify-center"
                    style={{
                      fontWeight: 500,
                      color: "#666",
                      lineHeight: 1.3,
                    }}
                  >
                    {folder.name}
                  </p>
                  <p
                    className="mt-0.5 leading-tight"
                    style={{ ...fontMono, fontSize: 10, color: "#AAA8A4" }}
                  >
                    {formatRelativeTime(folder.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent transcriptions ── */}
        <div className="animate-fade-up [animation-delay:200ms] flex-1 min-h-0 flex flex-col">
          {sortedRecent.length > 0 && (
            <SectionEyebrow
              label="Recent"
              href="/dashboard/transcriptions"
              linkLabel="View all"
            />
          )}

          {sortedRecent.length === 0 ? (
            /* Empty state */
            <div
              className="rounded-xl p-5 sm:p-8 lg:p-12 text-center"
              style={{ border: "1.5px dashed #E2E0DB", background: "#fff" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
                style={{ background: `${B}12` }}
              >
                <FileAudio size={20} style={{ color: B }} />
              </div>
              <h3
                className="mb-2"
                style={{
                  ...fontSyne,
                  fontWeight: 800,
                  fontSize: 16,
                  letterSpacing: "-0.02em",
                }}
              >
                Upload your first file
              </h3>
              <p
                className="text-sm mb-6 max-w-xs mx-auto"
                style={{ color: "#AAA8A4", lineHeight: 1.6 }}
              >
                Audio or video, up to 30 minutes. Your transcript is ready in
                under a minute.
              </p>
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                style={{ background: B, color: "#fff" }}
              >
                <Plus size={14} />
                New transcription
              </Link>
            </div>
          ) : (
            <RecentTranscriptionsList transcriptions={sortedRecent} />
          )}
        </div>
      </div>
    </DashboardResume>
  );
}
