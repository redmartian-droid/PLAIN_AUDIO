import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FoldersContent } from "@/components/dashboard/FoldersContent";

export default async function FoldersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: folders, error } = await supabase
    .from("folders")
    .select("*, transcriptions:transcriptions(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) console.error("Folders fetch error:", error);

  const normalized = (folders ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    created_at: f.created_at,
    transcriptionCount: f.transcriptions?.[0]?.count ?? 0,
    is_default: f.is_default,
  }));

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <FoldersContent initialFolders={normalized} />
    </div>
  );
}
