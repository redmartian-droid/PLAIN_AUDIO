"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, X, ChevronRight } from "lucide-react";
import { formatRelativeTime, cn } from "@/lib/utils";
import { FolderIcon } from "../ui/folder-icon";

type FolderItem = {
  id: string;
  name: string;
  created_at: string;
  transcriptionCount: number;
  is_default?: boolean;
};

const fontMono = {
  fontFamily: "var(--font-mono,'Courier New',monospace)",
} as const;

/* ─── Inline Create ─── */
function InlineFolderCard({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  async function handleConfirm() {
    if (!name.trim() || loading) return;
    setLoading(true);
    await onConfirm(name.trim());
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-1.5">
        <FolderIcon className="w-20 h-20 drop-shadow-sm" />
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="New Folder"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleConfirm();
          if (e.key === "Escape") onCancel();
        }}
        className="w-28 text-center bg-transparent text-xs font-medium placeholder:text-muted-foreground/60 outline-none transition-colors duration-150 rounded-sm px-1 py-0.5 focus:bg-[#F0EEEB]/40"
      />
      <div className="flex gap-1 mt-2">
        <button
          onClick={onCancel}
          className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!name.trim() || loading}
          className="px-3 py-1 text-xs font-semibold bg-foreground text-background rounded-full disabled:opacity-40 transition-all active:scale-[0.97]"
        >
          Create
        </button>
      </div>
    </div>
  );
}

/* ─── Mobile List Row ─── */
function FolderListRow({
  folder,
  isLast,
}: {
  folder: FolderItem;
  isLast: boolean;
}) {
  return (
    <Link
      href={`/dashboard/folders/${folder.id}`}
      className={cn(
        "group flex items-center gap-3 min-h-[44px] py-2.5",
        "active:opacity-60 transition-opacity",
        !isLast && "border-b border-border/40",
      )}
    >
      <FolderIcon className="w-5 h-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium truncate"
          style={{ color: "#0D0D0D" }}
        >
          {folder.name}
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{ ...fontMono, color: "#AAA8A4" }}
        >
          {formatRelativeTime(folder.created_at)}
          {folder.transcriptionCount > 0 &&
            ` · ${folder.transcriptionCount} item${folder.transcriptionCount !== 1 ? "s" : ""}`}
        </p>
      </div>
      {folder.is_default && (
        <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-medium shrink-0">
          Default
        </span>
      )}
      <ChevronRight size={14} className="shrink-0 text-muted-foreground/30" />
    </Link>
  );
}

/* ─── Desktop Grid Card ─── */
function FolderGridCard({ folder }: { folder: FolderItem }) {
  return (
    <Link
      href={`/dashboard/folders/${folder.id}`}
      className="group flex flex-col items-center text-center relative"
    >
      <div className="relative mb-1.5 transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
        <FolderIcon className="w-20 h-20 drop-shadow-sm" />
        {folder.transcriptionCount > 0 && (
          <div className="absolute -bottom-1 -right-1 bg-white text-black text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100">
            {folder.transcriptionCount}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-muted-foreground px-1 line-clamp-2 group-hover:text-foreground transition-colors leading-tight">
        {folder.name}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
        {formatRelativeTime(folder.created_at)}
      </p>
      {folder.is_default && (
        <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-medium mt-0.5">
          Default
        </span>
      )}
    </Link>
  );
}

/* ─── Main Component ─── */
export function FoldersContent({
  initialFolders,
}: {
  initialFolders: FolderItem[];
}) {
  const searchParams = useSearchParams();
  const [folders, setFolders] = useState<FolderItem[]>(initialFolders);
  const [inlineNew, setInlineNew] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setFolders(initialFolders);
  }, [initialFolders]);

  useEffect(() => {
    if (searchParams.get("new") === "1") setInlineNew(true);
  }, [searchParams]);

  async function handleCreate(name: string) {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (res.ok) {
      setFolders((prev) => [{ ...data, transcriptionCount: 0 }, ...prev]);
    }
    setInlineNew(false);
  }

  const filtered = search.trim()
    ? folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : folders;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Folders
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {folders.length} {folders.length === 1 ? "folder" : "folders"}
          </p>
        </div>

        <button
          onClick={() => setInlineNew(true)}
          disabled={inlineNew}
          className={cn(
            "hidden sm:inline-flex items-center justify-center gap-2",
            "bg-primary text-primary-foreground font-semibold rounded-xl",
            "min-h-[44px] px-4 text-sm",
            "[transition:background-color_150ms_ease,box-shadow_150ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1)]",
            "hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5",
            "active:scale-[.97] active:shadow-none active:translate-y-0",
            "disabled:opacity-50 disabled:pointer-events-none",
          )}
        >
          <Plus size={17} aria-hidden />
          New folder
        </button>
      </div>

      {/* Search — full width like TranscriptionsSearch */}
      <div className="flex sm:block items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search folders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full min-h-[44px] pl-9 pr-11 py-3",
              "bg-card border border-border rounded-xl",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "transition-[border-color,box-shadow] duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            )}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2",
                "w-11 h-11 flex items-center justify-center",
                "text-muted-foreground",
                "[transition:color_200ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1)]",
                "hover:text-foreground active:scale-90",
              )}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Mobile button */}
        <button
          onClick={() => setInlineNew(true)}
          disabled={inlineNew}
          aria-label="New folder"
          title="New folder"
          className={cn(
            "sm:hidden inline-flex items-center justify-center shrink-0",
            "size-11",
            "bg-primary text-primary-foreground font-semibold rounded-xl text-sm",
            "[transition:background-color_150ms_ease,box-shadow_150ms_ease,transform_250ms_cubic-bezier(.34,1.56,.64,1)]",
            "hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5",
            "active:scale-[.97] active:shadow-none active:translate-y-0",
            "disabled:opacity-50 disabled:pointer-events-none",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background",
          )}
        >
          <Plus size={17} aria-hidden />
        </button>
      </div>

      {/* Mobile: List View */}
      <div className="sm:hidden flex flex-col">
        {inlineNew && (
          <div className="py-4 border-b border-border/40">
            <InlineFolderCard
              onConfirm={handleCreate}
              onCancel={() => setInlineNew(false)}
            />
          </div>
        )}
        {filtered.map((folder, i) => (
          <FolderListRow
            key={folder.id}
            folder={folder}
            isLast={i === filtered.length - 1}
          />
        ))}
      </div>

      {/* Desktop: Grid View */}
      <div className="hidden sm:grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        {inlineNew && (
          <InlineFolderCard
            onConfirm={handleCreate}
            onCancel={() => setInlineNew(false)}
          />
        )}
        {filtered.map((folder) => (
          <FolderGridCard key={folder.id} folder={folder} />
        ))}
      </div>

      {/* Empty State */}
      {!inlineNew && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto mb-3">
            <FolderIcon className="w-20 h-20 mx-auto opacity-50" />
          </div>
          <p className="text-sm font-medium">No folders found</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {search.trim()
              ? "Try a different search term"
              : "Create your first folder to get started"}
          </p>
        </div>
      )}
    </>
  );
}
