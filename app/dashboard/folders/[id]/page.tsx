import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FolderPageClient from "./FolderPageClient";

export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: folder, error: folderError }, { data: transcriptions }] =
    await Promise.all([
      supabase
        .from("folders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("transcriptions")
        .select("id, title, status, duration_seconds, word_count, created_at")
        .eq("folder_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!folder || folderError) {
    return (
      <div className="flex-1 px-4 py-6 sm:p-8 max-w-5xl mx-auto w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Folder not found</p>
      </div>
    );
  }

  return (
    <FolderPageClient folder={folder} transcriptions={transcriptions ?? []} />
  );
}
