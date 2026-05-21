import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/dashboard/SettingsContent";

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

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <SettingsContent
        user={{ id: user.id, email: user.email ?? "" }}
        profile={profile}
      />
    </div>
  );
}
