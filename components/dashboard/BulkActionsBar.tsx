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
    <>
      {/* ── Desktop: floating pill ── */}
      <div
        className={cn(
          "hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "items-center gap-2 px-4 py-3 rounded-2xl",
          "bg-foreground text-background shadow-xl border border-foreground/10",
          "animate-in slide-in-from-bottom-4 fade-in duration-200",
          className,
        )}
      >
        <div className="flex items-center gap-2 pr-3 border-r border-background/20">
          <span className="text-sm font-semibold tabular-nums">
            {count} selected
          </span>
          <button
            onClick={onClear}
            aria-label="Clear selection"
            className="text-background/60 hover:text-background transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <BulkAction icon={Download} label="Export" onClick={onExport} />
        <BulkAction icon={FolderOpen} label="Move" onClick={onMove} />
        <BulkAction
          icon={Trash2}
          label="Delete"
          onClick={onDelete}
          destructive
        />
      </div>

      {/* ── Mobile: bottom toolbar ── */}
      <div
        className={cn(
          "sm:hidden fixed bottom-0 left-0 right-0 z-50",
          "flex items-center justify-between",
          "px-2 bg-foreground text-background",
          "animate-in slide-in-from-bottom-4 fade-in duration-200",
          className,
        )}
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          minHeight: "calc(52px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Left: count + clear */}
        <div className="flex items-center gap-1 pl-2">
          <span className="text-sm font-semibold tabular-nums">{count}</span>
          <button
            onClick={onClear}
            aria-label="Clear selection"
            className={cn(
              "flex items-center justify-center w-[44px] h-[44px] rounded-full",
              "text-background/60 hover:text-background hover:bg-background/10",
              "active:scale-90 transition-all",
            )}
          >
            <X size={15} />
          </button>
        </div>

        {/* Right: icon-only actions */}
        <div className="flex items-center gap-0.5 pr-1">
          <MobileAction icon={Download} label="Export" onClick={onExport} />
          <MobileAction icon={FolderOpen} label="Move" onClick={onMove} />
          <MobileAction
            icon={Trash2}
            label="Delete"
            onClick={onDelete}
            destructive
          />
        </div>
      </div>
    </>
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
        destructive ? "hover:text-red-400" : "hover:text-background",
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function MobileAction({
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
      aria-label={label}
      className={cn(
        "flex items-center justify-center",
        "w-[44px] h-[44px] rounded-xl",
        "transition-colors duration-150 active:scale-95",
        destructive
          ? "text-red-400 hover:bg-background/10 active:bg-background/15"
          : "text-background/70 hover:text-background hover:bg-background/10 active:bg-background/15",
      )}
    >
      <Icon size={20} strokeWidth={1.8} />
    </button>
  );
}
