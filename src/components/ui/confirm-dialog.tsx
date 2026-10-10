"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!pending) onCancel();
      }}
      dismissible={!pending}
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
