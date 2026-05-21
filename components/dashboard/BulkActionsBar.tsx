"use client";

import { Download, FolderOpen, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsBarProps {
  count: number;
  onExport: () => void;
  onMove: () => void;
  onDelete: () => void;
  onClear: () => void;
  className?: string;
}

export function BulkActionsBar({
  count,
  onExport,
  onMove,
  onDelete,
  onClear,
  className,
}: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-3 rounded-2xl",
        "bg-foreground text-background shadow-xl border border-foreground/10",
        "animate-in slide-in-from-bottom-4 fade-in duration-200",
        className,
      )}
    >
      {/* Count + clear */}
      <div className="flex items-center gap-2 pr-3 border-r border-background/20">
        <span className="text-sm font-semibold tabular-nums">
          {count} selected
        </span>
        <button
          onClick={onClear}
          className="text-background/60 hover:text-background transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Actions */}
      <BulkAction icon={Download} label="Export" onClick={onExport} />
      <BulkAction icon={FolderOpen} label="Move" onClick={onMove} />
      <BulkAction icon={Trash2} label="Delete" onClick={onDelete} destructive />
    </div>
  );
}

function BulkAction({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors",
        "hover:bg-background/15 text-background/80",
        destructive ? "hover:text-destructive" : "hover:text-background",
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
