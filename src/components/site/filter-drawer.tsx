"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react/ssr";
import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/components/motion/gsap";
import { MOTION, REDUCED_MOTION } from "@/lib/motion";
import { TEMPLATE_TAGS } from "@/lib/tags";
import { cn } from "@/lib/utils";

export const SORT_OPTIONS = [
  { value: "recommended", label: "Rekomendasi" },
  { value: "newest", label: "Terbaru" },
  { value: "price-asc", label: "Harga terendah" },
  { value: "price-desc", label: "Harga tertinggi" },
];

function Option({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: ReactNode; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      data-drawer-item=""
      className={cn(
        "flex w-full items-center justify-between gap-3 border-b border-line py-3 text-left text-sm transition-colors duration-200",
        active ? "text-ink" : "text-ink-soft hover:text-ink",
      )}
    >
      <span className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn("grid size-4 place-items-center ring-1 ring-inset transition-colors duration-200", active ? "bg-ink text-surface ring-ink" : "ring-line-strong")}
        >
          {active ? <CheckIcon size={10} weight="bold" /> : null}
        </span>
        {children}
      </span>
      {count !== undefined ? <span className="tabular text-xs text-ink-muted">{count}</span> : null}
    </button>
  );
}

/**
 * Panel filter yang meluncur dari kanan (500ms expo.out) dengan latar memudar;
 * isi masuk berurutan. Setiap pilihan langsung diterapkan (grid di belakang
 * berpindah dengan Flip). Menutup 300ms power3.in. Esc / klik latar = tutup.
 */
export function FilterDrawer({
  open,
  onClose,
  categories,
  category,
  tag,
  sort,
  onChange,
  onReset,
  hasFilters,
  total,
}: {
  open: boolean;
  onClose: () => void;
  categories: { slug: string; name: string; templateCount: number }[];
  category: string;
  tag: string;
  sort: string;
  onChange: (updates: Record<string, string | null>) => void;
  onReset: () => void;
  hasFilters: boolean;
  total: number | null;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const shown = useRef(false);

  useEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop) return;
    if (!open && !shown.current) return;
    const reduce = window.matchMedia(REDUCED_MOTION).matches;
    const items = panel.querySelectorAll<HTMLElement>("[data-drawer-item]");
    if (open) {
      shown.current = true;
      if (reduce) gsap.set([panel, backdrop], { autoAlpha: 1, xPercent: 0 });
      else {
        gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: MOTION.base, ease: MOTION.ease });
        gsap.fromTo(panel, { autoAlpha: 1, xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: MOTION.easeExpo });
        gsap.fromTo(items, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: MOTION.base, ease: MOTION.ease, stagger: 0.025, delay: 0.12 });
      }
      closeRef.current?.focus({ preventScroll: true });
    } else if (reduce) {
      gsap.set([panel, backdrop], { autoAlpha: 0 });
    } else {
      gsap.to(backdrop, { autoAlpha: 0, duration: MOTION.fast, ease: "power2.in" });
      gsap.to(panel, { xPercent: 100, duration: 0.3, ease: "power3.in", onComplete: () => gsap.set(panel, { autoAlpha: 0 }) });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div inert={!open} aria-hidden={!open}>
      <div ref={backdropRef} onClick={onClose} className="invisible fixed inset-0 z-[46] bg-ink/30 opacity-0" aria-hidden="true" />
      <div
        ref={panelRef}
        id="catalog-filter"
        role="dialog"
        aria-modal="true"
        aria-label="Filter katalog"
        className="invisible fixed inset-y-0 right-0 z-[47] flex w-full flex-col bg-surface opacity-0 sm:w-[25rem]"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-6">
          <p className="font-display text-base font-semibold tracking-[-0.02em] text-ink">Filter</p>
          <button ref={closeRef} type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full text-ink hover:bg-canvas" aria-label="Tutup filter">
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <fieldset>
            <legend className="label-caps text-ink-muted" data-drawer-item="">
              Kategori
            </legend>
            <div className="mt-2">
              <Option active={!category} onClick={() => onChange({ category: null })}>
                Semua kategori
              </Option>
              {categories.map((option) => (
                <Option key={option.slug} active={category === option.slug} onClick={() => onChange({ category: option.slug })} count={option.templateCount}>
                  {option.name}
                </Option>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="label-caps text-ink-muted" data-drawer-item="">
              Tag
            </legend>
            <div className="mt-2">
              {TEMPLATE_TAGS.map((option) => (
                <Option key={option.value} active={tag === option.value} onClick={() => onChange({ tag: tag === option.value ? null : option.value })}>
                  {option.label}
                </Option>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="label-caps text-ink-muted" data-drawer-item="">
              Urutkan
            </legend>
            <div className="mt-2">
              {SORT_OPTIONS.map((option) => (
                <Option key={option.value} active={sort === option.value} onClick={() => onChange({ sort: option.value })}>
                  {option.label}
                </Option>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onReset}
            disabled={!hasFilters}
            className="text-sm text-ink-soft underline decoration-accent underline-offset-4 hover:text-ink disabled:no-underline disabled:opacity-40"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center bg-ink px-6 text-sm font-medium text-surface transition-colors duration-200 hover:bg-ink/88 active:scale-[0.98]"
          >
            {total === null ? "Tampilkan hasil" : `Tampilkan ${total} undangan`}
          </button>
        </div>
      </div>
    </div>
  );
}
