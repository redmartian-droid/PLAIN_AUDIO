import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();

  // HIGH: Delete auth user FIRST, then clean up data to ensure atomicity
  // This prevents orphaned auth accounts if cleanup fails
  const { error: authError } = await admin.auth.admin.deleteUser(user.id);

  if (authError) {
    return NextResponse.json(
      { error: "Failed to delete account." },
      { status: 500 },
    );
  }

  // Now that auth is deleted, clean up user data
  // ─── 1. Collect all storage paths before deleting rows ──────────────────
  const { data: transcriptions } = await admin
    .from("transcriptions")
    .select("audio_storage_path")
    .eq("user_id", user.id);

  const paths = (transcriptions ?? [])
    .map((t) => t.audio_storage_path)
    .filter((p): p is string => !!p);

  // ─── 2. Delete DB records ───────────────────────────────────────────────
  await admin.from("transcriptions").delete().eq("user_id", user.id);
  await admin.from("folders").delete().eq("user_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);

  // ─── 3. Bulk delete storage files (chunked) ─────────────────────────────
  if (paths.length > 0) {
    const chunkSize = 100;
    for (let i = 0; i < paths.length; i += chunkSize) {
      const chunk = paths.slice(i, i + chunkSize);
      const { error } = await admin.storage.from("audio-uploads").remove(chunk);
      if (error) {
        console.warn(`Storage cleanup chunk ${i} failed:`, error);
      }
    }
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
