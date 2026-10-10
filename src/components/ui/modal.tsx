"use client";

import { XIcon } from "@phosphor-icons/react/ssr";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Dialog berbasis <dialog> native: focus trap, Escape, dan inert background
 * ditangani browser. Klik di luar panel menutup dialog.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-card bg-surface p-0 text-ink shadow-pop ring-1 ring-line open:animate-dialog",
        "max-h-[calc(100dvh-2rem)]",
        size === "sm" && "max-w-md",
        size === "md" && "max-w-xl",
        size === "lg" && "max-w-3xl",
      )}
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div>
              <h2 id={titleId} className="title-caps text-sm text-ink">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm text-ink-soft">
                  {description}
                </p>
              ) : null}
            </div>
            {dismissible ? (
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 grid size-10 shrink-0 place-items-center rounded-control text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                aria-label="Tutup"
              >
                <XIcon size={20} />
              </button>
            ) : null}
          </div>
          {children ? <div className="overflow-y-auto px-6 py-5">{children}</div> : null}
          {footer ? (
            <div className="flex flex-col-reverse gap-3 border-t border-line bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
