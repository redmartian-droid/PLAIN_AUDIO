import { Header } from "@/components/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  const dailyLimit = profile?.plan === "pro" ? Infinity : 3;

  const { data: folders } = await supabase
    .from("folders")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="dashboard-container">
      <Header
        user={{
          name: profile?.full_name || user.email?.split("@")[0],
          email: user.email,
          plan: profile?.plan || "free",
        }}
      />

      {/* HIG-compliant margins: 16px iPhone / 24px iPad / 48px desktop */}
      <div className="flex flex-1 overflow-hidden px-4 md:px-6 lg:px-12 pt-0">
        <Sidebar
          plan={profile?.plan || "free"}
          dailyUsed={profile?.daily_transcription_count || 0}
          dailyLimit={dailyLimit}
          folders={folders ?? []}
        />
        <main className="flex-1 min-w-0 overflow-y-auto scrollbar-hidden">
          {children}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
