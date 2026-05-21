"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FolderActions({
  folderId,
  folderName,
}: {
  folderId: string;
  folderName: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(folderName);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Sync if prop changes after refresh
  useEffect(() => {
    setNameDraft(folderName);
  }, [folderName]);

  const handleRename = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === folderName) {
      setIsRenaming(false);
      setNameDraft(folderName);
      return;
    }
    const { error } = await supabase
      .from("folders")
      .update({ name: trimmed })
      .eq("id", folderId);

    if (!error) {
      setIsRenaming(false);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    // Move transcriptions out first so they don't get orphaned
    await supabase
      .from("transcriptions")
      .update({ folder_id: null })
      .eq("folder_id", folderId);

    await supabase.from("folders").delete().eq("id", folderId);
    router.push("/dashboard/folders");
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setIsRenaming(true)}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground/60",
            "[transition:background-color_200ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1),border-color_200ms_ease,color_200ms_ease]",
            "hover:bg-accent/40 hover:text-foreground hover:border-border",
            "active:scale-90",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
          )}
          aria-label="Rename folder"
        >
          <Pencil size={13} />
        </button>

        <button
          onClick={() => setShowDeleteDialog(true)}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground/60",
            "[transition:background-color_200ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1),border-color_200ms_ease,color_200ms_ease]",
            "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30",
            "active:scale-90",
            "focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:ring-offset-2 focus:ring-offset-background",
          )}
          aria-label="Delete folder"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Rename Dialog */}
      {isRenaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-sm mb-4">Rename Folder</h3>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setNameDraft(folderName);
                  setIsRenaming(false);
                }
              }}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/10"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setNameDraft(folderName);
                  setIsRenaming(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Delete Folder</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Transcriptions in this folder will be moved to your library.
                  This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  handleDelete();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
