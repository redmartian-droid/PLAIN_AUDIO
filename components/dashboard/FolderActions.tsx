"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Pencil,
  Trash2,
  AlertTriangle,
  MoreHorizontal,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

const fontSyne = {
  fontFamily: "var(--font-syne,'Helvetica Neue',sans-serif)",
} as const;

const fontMono = {
  fontFamily: "var(--font-mono,'Courier New',monospace)",
} as const;

// ─── Shared icon button (desktop) ────────────────────────────────────────────

function ActionBtn({
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

// ─── Mobile bottom sheet (actions list) ──────────────────────────────────────

function ActionsSheet({
  open,
  onClose,
  onRename,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] sm:hidden"
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
        className="fixed bottom-0 left-0 right-0 z-[60] sm:hidden flex flex-col"
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
        aria-label="Folder actions"
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
            Folder actions
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#E8E5E1] text-muted-foreground"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-1">
          <button
            onClick={() => {
              onClose();
              onRename();
            }}
            className={cn(
              "flex items-center gap-3.5 w-full px-4 py-4 rounded-xl text-left",
              "transition-colors active:scale-[0.98] hover:bg-[#F0EEEB]",
            )}
          >
            <Pencil size={16} className="text-muted-foreground/60 shrink-0" />
            <span
              className="text-[15px] font-medium text-foreground"
              style={fontMono}
            >
              Rename
            </span>
          </button>

          <button
            onClick={() => {
              onClose();
              onDelete();
            }}
            className={cn(
              "flex items-center gap-3.5 w-full px-4 py-4 rounded-xl text-left",
              "transition-colors active:scale-[0.98] hover:bg-red-50",
            )}
          >
            <Trash2 size={16} className="text-red-500 shrink-0" />
            <span
              className="text-[15px] font-medium text-red-600"
              style={fontMono}
            >
              Delete folder
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <div
        className="fixed inset-0 z-[70] sm:hidden"
        style={{
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 320ms ease",
        }}
        onClick={onCancel}
        aria-hidden
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-[70] sm:hidden flex flex-col"
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
      >
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: "#E2E0DB" }}
          />
        </div>

        <div
          className="px-5 pt-2 pb-6"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(10px)",
            transition: open
              ? "opacity 300ms ease 80ms, transform 300ms cubic-bezier(0.32,0.72,0,1) 80ms"
              : "opacity 100ms ease, transform 100ms ease",
          }}
        >
          <div className="flex items-start gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#FEE2E2" }}
            >
              <AlertTriangle size={18} style={{ color: "#DC2626" }} />
            </div>
            <div>
              <h3
                className="text-[15px] font-semibold text-foreground"
                style={fontSyne}
              >
                Delete Folder
              </h3>
              <p
                className="text-[13px] leading-relaxed mt-1"
                style={{ color: "#888581" }}
              >
                Transcriptions in this folder will be moved to your library.
                This cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onCancel();
                onConfirm();
              }}
              className="w-full py-3.5 rounded-xl text-[15px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#DC2626", ...fontMono }}
            >
              Delete
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3.5 rounded-xl text-[15px] font-medium transition-colors hover:bg-[#F0EEEB] active:scale-[0.98]"
              style={{ color: "#6B6966", ...fontMono }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: Centered Modal */}
      <div
        className="hidden sm:flex fixed inset-0 z-[70] items-center justify-center p-4"
        style={{
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 200ms ease",
        }}
      >
        <div
          className="w-full max-w-sm rounded-xl overflow-hidden"
          style={{
            background: "#F8F7F4",
            border: "1px solid #E2E0DB",
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
            transform: open ? "scale(1)" : "scale(0.96)",
            opacity: open ? 1 : 0,
            transition:
              "transform 200ms cubic-bezier(0.32,0.72,0,1), opacity 200ms ease",
          }}
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#FEE2E2" }}
            >
              <AlertTriangle size={16} style={{ color: "#DC2626" }} />
            </div>
            <div className="pt-0.5">
              <h3
                className="text-[14px] font-semibold text-foreground leading-snug"
                style={fontSyne}
              >
                Delete Folder
              </h3>
              <p
                className="text-[12px] leading-relaxed mt-1"
                style={{ color: "#888581" }}
              >
                Transcriptions in this folder will be moved to your library.
                This cannot be undone.
              </p>
            </div>
          </div>

          <div
            className="flex items-center justify-end gap-2 px-5 py-3"
            style={{ background: "#F0EEEB", borderTop: "1px solid #E2E0DB" }}
          >
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors hover:bg-[#E8E5E1] active:scale-[.97]"
              style={{ color: "#6B6966", ...fontMono, letterSpacing: "0.04em" }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-colors hover:bg-red-700 active:scale-[.97]"
              style={{
                background: "#DC2626",
                ...fontMono,
                letterSpacing: "0.04em",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FolderActions({
  folderId,
  onStartRename,
}: {
  folderId: string;
  onStartRename: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    await supabase
      .from("transcriptions")
      .update({ folder_id: null })
      .eq("folder_id", folderId);

    await supabase.from("folders").delete().eq("id", folderId);
    router.push("/dashboard/folders");
  };

  return (
    <>
      {/* Mobile: single ellipsis trigger → ActionsSheet */}
      <button
        onClick={() => setShowActionsSheet(true)}
        aria-label="Folder actions"
        className={cn(
          "sm:hidden w-11 h-11 flex items-center justify-center rounded-xl border",
          "border-border/40 text-muted-foreground/60",
          "[transition:background-color_150ms_ease,transform_200ms_cubic-bezier(.34,1.56,.64,1)]",
          "active:scale-90 hover:bg-[#F0EEEB] hover:text-foreground hover:border-[#E2E0DB]",
          "focus-visible:outline-none focus-visible:bg-[#F0EEEB]",
        )}
      >
        <MoreHorizontal size={16} />
      </button>

      {/* Desktop: individual icon buttons */}
      <div className="hidden sm:flex items-center gap-1.5">
        <ActionBtn onClick={onStartRename} label="Rename folder">
          <Pencil size={15} />
        </ActionBtn>
        <ActionBtn
          onClick={() => setShowDeleteDialog(true)}
          label="Delete folder"
          danger
        >
          <Trash2 size={15} />
        </ActionBtn>
      </div>

      <ActionsSheet
        open={showActionsSheet}
        onClose={() => setShowActionsSheet(false)}
        onRename={() => {
          setShowActionsSheet(false);
          onStartRename();
        }}
        onDelete={() => {
          setShowActionsSheet(false);
          setShowDeleteDialog(true);
        }}
      />

      <DeleteDialog
        open={showDeleteDialog}
        onConfirm={() => {
          setShowDeleteDialog(false);
          handleDelete();
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
