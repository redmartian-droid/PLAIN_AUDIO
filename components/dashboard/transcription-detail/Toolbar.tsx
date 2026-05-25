"use client";

import React from "react";
import {
  Pencil,
  Trash2,
  FolderOpen,
  FileText,
  MoreHorizontal,
  X,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportButtons } from "@/components/dashboard/ExportButtons";

const fontSyne = {
  fontFamily: "var(--font-syne,'Helvetica Neue',sans-serif)",
} as const;

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  disabled,
  label,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "w-11 h-11 flex items-center justify-center rounded-xl border text-muted-foreground/60",
        "transition-all duration-150",
        "active:scale-90",
        "outline-none",
        "focus-visible:ring-1 focus-visible:ring-[#0D0D0D]/10 focus-visible:ring-inset focus-visible:bg-[#F0EEEB]/50",
        danger
          ? "border-border/40 hover:bg-red-50 hover:text-red-600 hover:border-red-200 focus-visible:ring-red-500/20 focus-visible:bg-red-50/50"
          : "border-border/40 hover:bg-[#F0EEEB] hover:text-foreground hover:border-[#E2E0DB]",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

// ─── Toolbar Divider ──────────────────────────────────────────────────────────

function ToolbarDivider() {
  return (
    <span
      className="w-px h-4 rounded-full flex-shrink-0"
      style={{ background: "#E2E0DB" }}
      aria-hidden
    />
  );
}

// ─── Action Sheet ─────────────────────────────────────────────────────────────

const ActionSheetContext = React.createContext<{ open: boolean }>({
  open: false,
});

function ActionSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <ActionSheetContext.Provider value={{ open }}>
      <div
        className="fixed inset-0 z-[70] lg:hidden"
        style={{
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 320ms ease",
        }}
        onClick={onClose}
        aria-hidden
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-[70] lg:hidden flex flex-col"
        style={{
          background: "#F8F7F4",
          borderRadius: "20px 20px 0 0",
          borderTop: "1px solid #E2E0DB",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 400ms cubic-bezier(0.32,0.72,0,1)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Actions menu"
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: "#E2E0DB" }}
          />
        </div>

        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid #E2E0DB" }}
        >
          <span
            className="text-[13px] font-semibold text-foreground"
            style={fontSyne}
          >
            Actions
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#E8E5E1] text-muted-foreground"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-1">{children}</div>
      </div>
    </ActionSheetContext.Provider>
  );
}

function ActionSheetItem({
  label,
  onClick,
  disabled,
  danger,
  index = 0,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  index?: number;
}) {
  const { open } = React.useContext(ActionSheetContext);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left px-4 py-4 rounded-xl transition-colors active:scale-[0.98]",
        "text-[15px] font-medium",
        "outline-none focus-visible:ring-1 focus-visible:ring-[#0D0D0D]/10 focus-visible:ring-inset focus-visible:bg-[#F0EEEB]/70",
        danger
          ? "text-red-600 hover:bg-red-50 focus-visible:ring-red-500/20 focus-visible:bg-red-50/50"
          : "text-foreground hover:bg-[#F0EEEB]",
        disabled && "opacity-40 cursor-not-allowed",
      )}
      style={{
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(10px)",
        transition: open
          ? `opacity 300ms ease ${120 + index * 55}ms, transform 300ms cubic-bezier(0.32,0.72,0,1) ${120 + index * 55}ms`
          : "opacity 100ms ease, transform 100ms ease",
      }}
    >
      {label}
    </button>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

interface ToolbarProps {
  onEditText: () => void;
  onRename: () => void;
  onDownload: () => void;
  canDownload: boolean;
  onMoveToFolder: () => void;
  onDelete: () => void;
  showMobileActions: boolean;
  onMobileActionsChange: (open: boolean) => void;
  transcription: {
    id: string;
    title: string;
    full_text: string;
    segments: Array<{
      start: number;
      end: number;
      text: string;
      speaker?: string;
    }> | null;
  };
}

export function Toolbar({
  onEditText,
  onRename,
  onDownload,
  canDownload,
  onMoveToFolder,
  onDelete,
  showMobileActions,
  onMobileActionsChange,
  transcription,
}: ToolbarProps) {
  return (
    <div className="flex-shrink-0 flex items-center gap-2 pt-0.5">
      {/* Mobile + Tablet: Export (icon-only) + single More trigger */}
      <div className="flex items-center gap-1 lg:hidden">
        <ExportButtons
          transcription={{
            id: transcription.id,
            title: transcription.title,
            full_text: transcription.full_text,
            segments: transcription.segments ?? null,
          }}
        />
        <ToolbarBtn
          onClick={() => onMobileActionsChange(true)}
          label="More actions"
        >
          <MoreHorizontal size={15} />
        </ToolbarBtn>
      </div>

      {/* Mobile + Tablet Action Sheet — text-only rows */}
      <ActionSheet
        open={showMobileActions}
        onClose={() => onMobileActionsChange(false)}
      >
        <ActionSheetItem
          label="Edit transcript"
          onClick={() => {
            onMobileActionsChange(false);
            onEditText();
          }}
          index={0}
        />
        <ActionSheetItem
          label="Rename"
          onClick={() => {
            onMobileActionsChange(false);
            onRename();
          }}
          index={1}
        />
        <ActionSheetItem
          label="Download audio"
          onClick={() => {
            onMobileActionsChange(false);
            onDownload();
          }}
          disabled={!canDownload}
          index={2}
        />
        <ActionSheetItem
          label="Move to folder"
          onClick={() => {
            onMobileActionsChange(false);
            onMoveToFolder();
          }}
          index={3}
        />
        <ActionSheetItem
          label="Delete"
          danger
          onClick={() => {
            onMobileActionsChange(false);
            onDelete();
          }}
          index={4}
        />
      </ActionSheet>

      {/* Desktop: full toolbar + Export */}
      <div className="hidden lg:flex items-center gap-1">
        <ToolbarBtn onClick={onEditText} label="Edit transcript">
          <Type size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={onRename} label="Rename">
          <Pencil size={13} />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          onClick={onDownload}
          disabled={!canDownload}
          label="Download audio"
        >
          <FileText size={13} />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn onClick={onMoveToFolder} label="Move to folder">
          <FolderOpen size={13} />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn onClick={onDelete} label="Delete" danger>
          <Trash2 size={13} />
        </ToolbarBtn>
      </div>

      <div className="hidden lg:block">
        <ExportButtons
          transcription={{
            id: transcription.id,
            title: transcription.title,
            full_text: transcription.full_text,
            segments: transcription.segments ?? null,
          }}
        />
      </div>
    </div>
  );
}
