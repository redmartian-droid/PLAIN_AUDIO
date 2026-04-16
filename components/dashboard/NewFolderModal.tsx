"use client";

import { useState, useRef } from "react";
import { X, Loader2 } from "lucide-react";

type NewFolderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onFolderCreated: (folderId: string) => void;
};

export function NewFolderModal({
  isOpen,
  onClose,
  onFolderCreated,
}: NewFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!folderName.trim()) {
      setError("Folder name cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create folder");
      }

      const folder = await response.json();
      setFolderName("");
      onFolderCreated(folder.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-xl max-w-sm w-full animate-fade-up">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold text-ink">New folder</h2>
          <button
            onClick={onClose}
            className="text-mist hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Folder name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g., Interviews, Meetings..."
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-ink placeholder-mist focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-all"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-ink hover:bg-mist/10 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-terra text-white rounded-lg text-sm font-medium hover:bg-terra-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
