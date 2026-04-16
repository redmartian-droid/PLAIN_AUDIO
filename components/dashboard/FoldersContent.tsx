"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { NewFolderModal } from "./NewFolderModal";

type Folder = {
  id: string;
  name: string;
  created_at: string;
  transcriptionCount: number;
};

export function FoldersContent({
  initialFolders,
}: {
  initialFolders: Folder[];
}) {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFolderCreated = (folderId: string) => {
    // Refetch the folders list or add the new folder optimistically
    // For now, just close the modal - the user can refresh to see it
    setFolders([]);
    // Trigger a page refresh to get the new folder
    window.location.reload();
  };

  return (
    <>
      <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink mb-1">
              Folders
            </h1>
            <p className="text-mist text-sm">{folders.length} total</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-amber text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-dark transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber/20"
          >
            <Plus size={14} />
            New folder
          </button>
        </div>

        {folders.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-2xl p-16 text-center animate-fade-up">
            <div className="w-12 h-12 rounded-2xl bg-amber-light flex items-center justify-center mx-auto mb-4">
              <FolderOpen size={20} className="text-amber" />
            </div>
            <h3 className="font-semibold text-ink mb-1.5">No folders yet</h3>
            <p className="text-sm text-mist mb-5">
              Create a folder to organize your transcriptions.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-ink text-surface text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ink-soft transition-colors"
            >
              <Plus size={14} /> Create your first
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
            {folders.map((folder: any) => (
              <Link
                key={folder.id}
                href={`/dashboard/folders/${folder.id}`}
                className="flex flex-col bg-surface border border-border rounded-xl p-5 hover:border-amber/30 hover:shadow-soft transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-light flex items-center justify-center group-hover:bg-amber/10 transition-colors">
                    <FolderOpen size={18} className="text-amber" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-ink mb-1 line-clamp-2">
                  {folder.name}
                </p>
                <p className="text-xs text-mist mb-3">
                  {folder.transcriptionCount}{" "}
                  {folder.transcriptionCount === 1
                    ? "transcription"
                    : "transcriptions"}
                </p>
                <p className="text-xs text-mist-light mt-auto">
                  Modified {formatRelativeTime(folder.created_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <NewFolderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFolderCreated={handleFolderCreated}
      />
    </>
  );
}
