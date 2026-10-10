"use client";

import { ArrowCounterClockwiseIcon, CheckIcon, FloppyDiskIcon } from "@phosphor-icons/react/ssr";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const UNSAVED_MESSAGE = "Ada perubahan yang belum disimpan. Tinggalkan halaman ini dan buang perubahannya?";

/**
 * Cegah perubahan hilang tanpa sengaja: peringatan browser saat menutup tab /
 * reload, dan konfirmasi saat mengklik link internal (navigasi Next.js tidak
 * memicu beforeunload).
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(UNSAVED_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}

/**
 * Bar simpan yang menempel di bawah layar. Satu tempat untuk menyimpan,
 * dengan status yang jelas: ada perubahan atau sudah tersimpan.
 */
export function SaveBar({
  dirty,
  pending,
  onReset,
  saveLabel = "Simpan perubahan",
  dirtyText = "Ada perubahan yang belum disimpan",
  form,
  className,
}: {
  dirty: boolean;
  pending: boolean;
  onReset?: () => void;
  saveLabel?: string;
  /** Teks status saat ada yang belum disimpan (mis. form baru). */
  dirtyText?: string;
  /** id form bila bar berada di luar elemen <form>. */
  form?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-surface px-4 py-3 md:-mx-8 md:px-8",
        className,
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p data-save-status="" className="min-w-0 text-sm" aria-live="polite">
          {dirty ? (
            <span className="font-medium text-warning">{dirtyText}</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <CheckIcon size={14} aria-hidden="true" />
              Semua perubahan tersimpan
            </span>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {onReset ? (
            <Button variant="ghost" size="md" onClick={onReset} disabled={!dirty || pending} className="hidden sm:inline-flex">
              <ArrowCounterClockwiseIcon size={16} aria-hidden="true" />
              Batalkan
            </Button>
          ) : null}
          <Button type="submit" form={form} size="md" loading={pending} disabled={!dirty}>
            {!pending ? <FloppyDiskIcon size={16} aria-hidden="true" /> : null}
            {pending ? "Menyimpan..." : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Bandingkan nilai form dengan nilai awal (cukup untuk objek data form biasa). */
export function isDirty(current: unknown, initial: unknown): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial);
}
