"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/validation/common";

/**
 * Toast untuk hasil useActionState, lalu fokus ke field pertama yang error
 * supaya pengguna keyboard/screen reader langsung tahu apa yang perlu diperbaiki.
 */
export function useActionFeedback(state: ActionResult<unknown> | null, onSuccess?: () => void) {
  const handled = useRef<ActionResult<unknown> | null>(null);
  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      toast.success(state.message);
      onSuccess?.();
    } else {
      toast.error(state.message);
      requestAnimationFrame(() => {
        const invalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
        invalid?.focus();
      });
    }
  }, [state, onSuccess]);
}

/** Jalankan server action sekali klik (toggle, hapus, urutkan) dengan toast + refresh. */
export function useServerAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, options?: { onSuccess?: () => void }) {
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) {
          toast.success(result.message);
          options?.onSuccess?.();
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Terjadi kesalahan jaringan. Periksa koneksi lalu coba lagi.");
      }
    });
  }

  return { pending, run };
}
