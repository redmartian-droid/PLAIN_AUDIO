import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FoldersContent } from "@/components/dashboard/FoldersContent";

export default async function FoldersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: folders } = await supabase
    .from("folders")
    .select("*, transcriptions(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Cast the count result properly
  const foldersWithCount = (folders || []).map((folder: any) => ({
    ...folder,
    transcriptionCount: folder.transcriptions?.[0]?.count || 0,
  }));

  return <FoldersContent initialFolders={foldersWithCount} />;
}
