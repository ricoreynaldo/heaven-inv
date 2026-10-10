"use client";

import {
  ArrowDownIcon,
  ArrowSquareOutIcon,
  ArrowUpIcon,
  DotsThreeIcon,
  FireIcon,
  HouseIcon,
  PlayIcon,
  TrashIcon,
} from "@phosphor-icons/react/ssr";
import { useEffect, useRef, useState } from "react";
import {
  deleteTemplateAction,
  moveTemplateAction,
  setTemplateFeaturedAction,
  setTemplatePublishedAction,
  toggleTemplateTagAction,
} from "@/actions/templates";
import { useServerAction } from "@/components/admin/use-action-feedback";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const iconButton =
  "grid size-9 place-items-center rounded-control text-ink-muted transition-colors duration-200 hover:bg-canvas hover:text-ink disabled:opacity-30";

export function PublishToggle({ id, name, value }: { id: string; name: string; value: boolean }) {
  const { pending, run } = useServerAction();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={`${value ? "Sembunyikan" : "Tampilkan"} ${name} di situs`}
      title={value ? "Terlihat pengunjung. Klik untuk menyembunyikan (draft)." : "Draft, tidak terlihat pengunjung. Klik untuk menampilkan."}
      disabled={pending}
      onClick={() => run(() => setTemplatePublishedAction(id, !value))}
      className="group inline-flex items-center gap-2 rounded-control py-1 pr-2 disabled:opacity-60"
    >
      <span className={cn("relative h-5 w-9 rounded-full transition-colors duration-200", value ? "bg-ink" : "bg-line-strong")}>
        <span
          className={cn(
            "absolute left-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-surface transition-transform duration-200 ease-out",
            value && "translate-x-4",
          )}
        >
          {pending ? <Spinner className="size-2.5 text-ink-muted" /> : null}
        </span>
      </span>
      <span className={cn("text-sm", value ? "text-ink" : "text-ink-muted")}>{value ? "Tampil" : "Draft"}</span>
    </button>
  );
}

/** Tag Best Seller sekali klik dari tabel. Tag lain diatur di form edit. */
export function BestSellerToggle({ id, name, value }: { id: string; name: string; value: boolean }) {
  const { pending, run } = useServerAction();
  return (
    <button
      type="button"
      aria-pressed={value}
      aria-label={value ? `Lepas tag Best Seller dari ${name}` : `Tandai ${name} sebagai Best Seller`}
      title={value ? "Bertag Best Seller. Klik untuk melepas." : "Klik untuk memasang tag Best Seller."}
      disabled={pending}
      onClick={() => run(() => toggleTemplateTagAction(id, "best-seller", !value))}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-control px-3 text-xs font-medium transition-colors duration-200 disabled:opacity-60",
        value ? "bg-ink text-surface" : "text-ink-muted ring-1 ring-inset ring-line-strong hover:text-ink hover:ring-accent",
      )}
    >
      {pending ? <Spinner className="size-3" /> : <FireIcon size={14} weight={value ? "fill" : "regular"} aria-hidden="true" />}
      Best Seller
    </button>
  );
}

/** Tampil di section Koleksi Pilihan beranda, sekali klik dari tabel. */
export function FeaturedToggle({ id, name, value }: { id: string; name: string; value: boolean }) {
  const { pending, run } = useServerAction();
  return (
    <button
      type="button"
      aria-pressed={value}
      aria-label={value ? `Keluarkan ${name} dari beranda` : `Tampilkan ${name} di beranda`}
      title={value ? "Tampil di Koleksi Pilihan beranda. Klik untuk mengeluarkan." : "Klik untuk menampilkan di Koleksi Pilihan beranda."}
      disabled={pending}
      onClick={() => run(() => setTemplateFeaturedAction(id, !value))}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-control px-3 text-xs font-medium transition-colors duration-200 disabled:opacity-60",
        value ? "bg-accent-soft text-ink ring-1 ring-inset ring-accent" : "text-ink-muted ring-1 ring-inset ring-line-strong hover:text-ink hover:ring-accent",
      )}
    >
      {pending ? <Spinner className="size-3" /> : <HouseIcon size={14} weight={value ? "fill" : "regular"} aria-hidden="true" />}
      Beranda
    </button>
  );
}

/**
 * Aksi sekunder per baris dalam satu menu: lihat di situs, buka demo, hapus.
 * Posisi fixed dihitung dari tombol supaya tidak terpotong tabel yang bisa
 * digulir horizontal.
 */
export function TemplateRowMenu({
  id,
  name,
  publicUrl,
  demoUrl,
}: {
  id: string;
  name: string;
  publicUrl: string | null;
  demoUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const [confirming, setConfirming] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { pending, run } = useServerAction();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setOpen((value) => !value);
  }

  const item =
    "flex w-full items-center gap-2.5 rounded-inner px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Aksi lain untuk ${name}`}
        title="Aksi lain"
        className={iconButton}
      >
        <DotsThreeIcon size={20} weight="bold" />
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Aksi untuk ${name}`}
          className="fixed z-50 w-52 animate-fade rounded-card bg-surface p-1.5 shadow-pop ring-1 ring-line"
          style={{ top: position.top, right: position.right }}
        >
          {publicUrl ? (
            <a role="menuitem" href={publicUrl} target="_blank" rel="noopener noreferrer" className={item} onClick={() => setOpen(false)}>
              <ArrowSquareOutIcon size={16} className="text-ink-muted" aria-hidden="true" />
              Lihat di situs
            </a>
          ) : (
            <span className={cn(item, "cursor-default text-ink-muted hover:bg-transparent")}>
              <ArrowSquareOutIcon size={16} aria-hidden="true" />
              Belum tampil di situs
            </span>
          )}
          {demoUrl ? (
            <a role="menuitem" href={demoUrl} target="_blank" rel="noopener noreferrer" className={item} onClick={() => setOpen(false)}>
              <PlayIcon size={16} className="text-ink-muted" aria-hidden="true" />
              Buka demo
            </a>
          ) : null}
          <div className="my-1 h-px bg-line" />
          <button
            role="menuitem"
            type="button"
            className={cn(item, "text-danger hover:bg-danger-soft focus-visible:bg-danger-soft")}
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
          >
            <TrashIcon size={16} aria-hidden="true" />
            Hapus undangan
          </button>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirming}
        title={`Hapus "${name}"?`}
        description="Undangan beserta galerinya dihapus permanen dari katalog. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, hapus"
        pending={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => run(() => deleteTemplateAction(id), { onSuccess: () => setConfirming(false) })}
      />
    </>
  );
}

export function ReorderButtons({ id, name, isFirst, isLast }: { id: string; name: string; isFirst: boolean; isLast: boolean }) {
  const { pending, run } = useServerAction();
  return (
    <div className="flex items-center" aria-busy={pending}>
      <button
        type="button"
        onClick={() => run(() => moveTemplateAction(id, "up"))}
        disabled={pending || isFirst}
        aria-label={`Naikkan urutan ${name}`}
        className={iconButton}
      >
        <ArrowUpIcon size={15} />
      </button>
      <button
        type="button"
        onClick={() => run(() => moveTemplateAction(id, "down"))}
        disabled={pending || isLast}
        aria-label={`Turunkan urutan ${name}`}
        className={iconButton}
      >
        <ArrowDownIcon size={15} />
      </button>
    </div>
  );
}

export function DeleteTemplateButton({
  id,
  name,
  variant = "icon",
  onDeleted,
}: {
  id: string;
  name: string;
  variant?: "icon" | "button";
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useServerAction();
  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Hapus ${name}`}
          className="grid size-9 place-items-center rounded-control text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <TrashIcon size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-control text-sm font-medium text-danger ring-1 ring-inset ring-danger/25 transition-colors hover:bg-danger-soft"
        >
          <TrashIcon size={16} aria-hidden="true" />
          Hapus undangan
        </button>
      )}
      <ConfirmDialog
        open={open}
        title={`Hapus "${name}"?`}
        description="Undangan beserta galerinya dihapus permanen dari katalog. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, hapus"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() =>
          run(() => deleteTemplateAction(id), {
            onSuccess: () => {
              setOpen(false);
              onDeleted?.();
            },
          })
        }
      />
    </>
  );
}
