"use client";

import React from "react";
import {
  Pencil,
  Download,
  Trash2,
  FolderOpen,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportButtons } from "@/components/dashboard/ExportButtons";

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
        "[transition:background-color_150ms_ease,transform_200ms_cubic-bezier(.34,1.56,.64,1),border-color_150ms_ease,color_150ms_ease]",
        "active:scale-90",
        "focus-visible:outline-none focus-visible:bg-[#F0EEEB]",
        danger
          ? "border-border/40 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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
        className="fixed inset-0 z-[70] md:hidden"
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
        className="fixed bottom-0 left-0 right-0 z-[70] md:hidden flex flex-col"
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
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: "#E2E0DB" }}
          />
        </div>
        <div className="p-2 pb-4">{children}</div>
      </div>
    </ActionSheetContext.Provider>
  );
}

function ActionSheetItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
  index = 0,
}: {
  icon: React.ElementType;
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
        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors active:scale-[0.98]",
        danger
          ? "text-red-600 hover:bg-red-50"
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
      <Icon size={18} strokeWidth={2} />
      <span className="text-[15px] font-medium">{label}</span>
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
      {/* Mobile: Export (icon-only) + single More trigger */}
      <div className="flex items-center gap-1 md:hidden">
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

      {/* Mobile Action Sheet — all actions inside */}
      <ActionSheet
        open={showMobileActions}
        onClose={() => onMobileActionsChange(false)}
      >
        <ActionSheetItem
          icon={FileText}
          label="Edit transcript"
          onClick={() => {
            onMobileActionsChange(false);
            onEditText();
          }}
          index={0}
        />
        <ActionSheetItem
          icon={Pencil}
          label="Rename"
          onClick={() => {
            onMobileActionsChange(false);
            onRename();
          }}
          index={1}
        />
        <ActionSheetItem
          icon={Download}
          label="Download audio"
          onClick={() => {
            onMobileActionsChange(false);
            onDownload();
          }}
          disabled={!canDownload}
          index={2}
        />
        <ActionSheetItem
          icon={FolderOpen}
          label="Move to folder"
          onClick={() => {
            onMobileActionsChange(false);
            onMoveToFolder();
          }}
          index={3}
        />
        <ActionSheetItem
          icon={Trash2}
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
      <div className="hidden md:flex items-center gap-1">
        <ToolbarBtn onClick={onEditText} label="Edit transcript">
          <FileText size={13} />
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
          <Download size={13} />
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

      <div className="hidden md:block">
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
