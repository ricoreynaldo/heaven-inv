"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      duration={4000}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-card! border! border-line! bg-surface! text-ink! shadow-pop! font-sans! text-[0.9375rem]! gap-3! px-4! py-3.5!",
          title: "font-medium!",
          description: "text-ink-soft!",
          success: "[&_[data-icon]]:text-success!",
          error: "[&_[data-icon]]:text-danger!",
          closeButton: "border-line! bg-surface! text-ink-muted! hover:text-ink!",
        },
      }}
    />
  );
}
