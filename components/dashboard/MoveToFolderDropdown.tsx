"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Folder = {
  id: string;
  name: string;
};

type MoveToFolderDropdownProps = {
  transcriptionId: string;
  currentFolderId: string | null;
  onMoved?: () => void;
};

export function MoveToFolderDropdown({
  transcriptionId,
  currentFolderId,
  onMoved,
}: MoveToFolderDropdownProps) {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchFolders = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { data } = await supabase
          .from("folders")
          .select("id, name")
          .order("created_at", { ascending: false });

        setFolders(data || []);
      } catch (err) {
        setError("Failed to load folders");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolders();
  }, [isOpen, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMoveToFolder = async (folderId: string | null) => {
    setIsMoving(true);
    setError("");
    try {
      const { error: updateError } = await supabase
        .from("transcriptions")
        .update({ folder_id: folderId })
        .eq("id", transcriptionId);

      if (updateError) throw updateError;

      setIsOpen(false);
      onMoved?.();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to move transcription",
      );
      console.error(err);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isMoving}
        className="flex items-center gap-2 text-sm text-[var(--warning)] hover:text-[var(--warning)]/80 font-medium transition-colors disabled:opacity-50"
      >
        <FolderOpen size={14} />
        Move to folder
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden animate-fade-in">
          {error && (
            <div className="p-3 bg-destructive/10 border-b border-destructive/20 flex items-start gap-2">
              <AlertCircle
                size={14}
                className="text-destructive mt-0.5 shrink-0"
              />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2
                  size={16}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : folders.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No folders yet. Create one first.
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {currentFolderId && (
                  <button
                    onClick={() => handleMoveToFolder(null)}
                    disabled={isMoving}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    No folder
                  </button>
                )}
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleMoveToFolder(folder.id)}
                    disabled={isMoving || folder.id === currentFolderId}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors disabled:opacity-50 ${
                      folder.id === currentFolderId
                        ? "bg-accent text-foreground font-medium"
                        : "text-foreground"
                    }`}
                  >
                    {folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
