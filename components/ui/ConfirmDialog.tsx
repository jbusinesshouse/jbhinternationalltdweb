"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "নিশ্চিত করুন",
  cancelLabel = "বাতিল",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="absolute inset-0 bg-navy-dark/50 backdrop-blur-sm" onClick={() => !loading && onCancel()} />
      <div className="relative w-full max-w-md rounded-[22px] border border-border bg-white p-6 shadow-[0_24px_60px_rgba(13,24,46,0.25)]">
        <h2 id="confirm-dialog-title" className="text-lg font-extrabold text-foreground">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}
        {children}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "অপেক্ষা করুন…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
