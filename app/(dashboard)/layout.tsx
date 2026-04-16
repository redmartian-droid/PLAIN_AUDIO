import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CommandPalette } from "@/components/dashboard/CommandPalette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan, daily_transcription_count, daily_reset_at")
    .eq("id", user.id)
    .single();

  // Reset daily count if it's a new day
  if (
    profile &&
    profile.daily_reset_at < new Date().toISOString().split("T")[0]
  ) {
    await supabase
      .from("profiles")
      .update({
        daily_transcription_count: 0,
        daily_reset_at: new Date().toISOString().split("T")[0],
      })
      .eq("id", user.id);
  }

  const dailyLimit = profile?.plan === "pro" ? Infinity : 3;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userName={profile?.full_name || user.email?.split("@")[0]}
        plan={profile?.plan || "free"}
        dailyUsed={profile?.daily_transcription_count || 0}
        dailyLimit={dailyLimit}
      />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
      <CommandPalette />
    </div>
  );
}
