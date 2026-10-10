"use client";

import { ArrowRightIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/components/motion/gsap";
import { Price } from "@/components/site/price";
import { SmartImage } from "@/components/ui/smart-image";
import type { SearchItem } from "@/lib/data/public";
import { MOTION, REDUCED_MOTION } from "@/lib/motion";

const MAX_RESULTS = 6;

/**
 * Pencarian instan: panel turun dari atas (500ms expo.out) dengan latar yang
 * memudar, hasil (thumbnail + nama + kategori + harga) muncul berurutan saat
 * mengetik. Pencarian di browser atas indeks kecil dari server.
 * Enter = buka semua hasil di katalog. Esc / klik latar = tutup.
 */
export function SearchOverlay({ open, onClose, index }: { open: boolean; onClose: () => void; index: SearchItem[] }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = useRef(false);
  const [q, setQ] = useState("");

  const needle = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!needle) return index.filter((item) => item.tags.includes("best-seller")).slice(0, MAX_RESULTS);
    const words = needle.split(/\s+/);
    return index.filter((item) => words.every((word) => item.haystack.includes(word))).slice(0, MAX_RESULTS);
  }, [index, needle]);
  const total = needle ? index.filter((item) => needle.split(/\s+/).every((word) => item.haystack.includes(word))).length : 0;
  const resultKey = results.map((item) => item.slug).join(",");

  // Buka / tutup panel.
  useEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop) return;
    if (!open && !shown.current) return;
    const reduce = window.matchMedia(REDUCED_MOTION).matches;
    if (open) {
      shown.current = true;
      if (reduce) gsap.set([panel, backdrop], { autoAlpha: 1, yPercent: 0 });
      else {
        gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: MOTION.base, ease: MOTION.ease });
        gsap.fromTo(panel, { autoAlpha: 1, yPercent: -100 }, { yPercent: 0, duration: 0.5, ease: MOTION.easeExpo });
      }
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), reduce ? 0 : 120);
    } else if (reduce) {
      gsap.set([panel, backdrop], { autoAlpha: 0 });
    } else {
      gsap.to(backdrop, { autoAlpha: 0, duration: MOTION.fast, ease: "power2.in" });
      gsap.to(panel, { yPercent: -100, duration: 0.3, ease: "power3.in", onComplete: () => gsap.set(panel, { autoAlpha: 0 }) });
    }
  }, [open]);

  // Hasil baru: muncul berurutan.
  useEffect(() => {
    if (!open || !listRef.current || window.matchMedia(REDUCED_MOTION).matches) return;
    gsap.fromTo(
      listRef.current.children,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: MOTION.ease, stagger: 0.04, overwrite: true },
    );
  }, [resultKey, open]);

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

  const close = () => {
    onClose();
    setQ("");
  };

  return (
    <div inert={!open} aria-hidden={!open}>
      <div ref={backdropRef} onClick={close} className="invisible fixed inset-0 z-[46] bg-ink/30 opacity-0" aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cari undangan"
        className="invisible fixed inset-x-0 top-0 z-[47] max-h-dvh overflow-y-auto bg-surface opacity-0"
      >
        <div className="container-page pb-10 pt-6 md:pb-14 md:pt-8">
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              if (!needle) return;
              router.push(`/catalog?q=${encodeURIComponent(q.trim())}`);
              close();
            }}
            className="flex items-center gap-4 border-b border-ink pb-3"
          >
            <MagnifyingGlassIcon size={22} className="shrink-0 text-ink" aria-hidden="true" />
            <label htmlFor="site-search" className="sr-only">
              Cari undangan
            </label>
            <input
              ref={inputRef}
              id="site-search"
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Cari nama, tema, atau kategori"
              autoComplete="off"
              enterKeyHint="search"
              className="title-caps min-w-0 flex-1 bg-transparent text-lg text-ink placeholder:font-medium placeholder:text-ink-muted focus:outline-none sm:text-2xl [&::-webkit-search-cancel-button]:hidden"
            />
            <button type="button" onClick={close} className="grid size-10 shrink-0 place-items-center rounded-full text-ink hover:bg-canvas" aria-label="Tutup pencarian">
              <XIcon size={20} />
            </button>
          </form>

          <div className="mt-6 flex items-baseline justify-between gap-4">
            <p className="label-caps text-ink-muted" aria-live="polite">
              {needle ? (results.length ? `${total} hasil` : "Tidak ada yang cocok") : "Best seller"}
            </p>
            {needle && total > 0 ? (
              <Link
                href={`/catalog?q=${encodeURIComponent(q.trim())}`}
                onClick={close}
                className="group inline-flex items-center gap-1.5 text-xs font-medium text-ink underline decoration-accent underline-offset-4 hover:decoration-ink"
              >
                Lihat semua di katalog
                <ArrowRightIcon size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          {results.length > 0 ? (
            <ul ref={listRef} className="mt-4 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
              {results.map((item) => (
                <li key={item.slug}>
                  <Link href={`/catalog/${item.slug}`} onClick={close} className="group block">
                    <span className="relative block aspect-[4/5] overflow-hidden bg-canvas">
                      <SmartImage
                        src={item.thumbnail}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 14vw, 45vw"
                        className="object-cover transition-transform duration-400 ease-expo group-hover:scale-[1.04]"
                      />
                    </span>
                    <span className="mt-2.5 block font-display text-sm font-semibold tracking-[-0.01em] text-ink">{item.name}</span>
                    <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-ink-muted">
                      {item.category}
                      <Price price={item.price} originalPrice={item.originalPrice} priceClassName="text-ink" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : needle ? (
            <p className="mt-4 max-w-md text-sm text-ink-soft">
              Coba kata lain, misalnya nama kategori seperti Wedding atau Islamic.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
