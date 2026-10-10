"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { MOTION, REDUCED_MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Pagination teks "Sebelumnya  3 / 8  Berikutnya". Saat halaman berganti,
 * angka halaman bergulir masuk dari arah perpindahan (naik saat maju, turun
 * saat mundur), 400ms expo.out. Grid-nya sendiri memudar berurutan (FlipGrid).
 */
export function CatalogPagination({
  page,
  pageCount,
  prevHref,
  nextHref,
}: {
  page: number;
  pageCount: number;
  prevHref: string | null;
  nextHref: string | null;
}) {
  const rollRef = useRef<HTMLSpanElement>(null);
  const previous = useRef(page);

  useEffect(() => {
    const el = rollRef.current;
    const from = previous.current;
    previous.current = page;
    if (!el || from === page || window.matchMedia(REDUCED_MOTION).matches) return;
    const direction = page > from ? 1 : -1;
    gsap.fromTo(el, { yPercent: direction * 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: MOTION.base, ease: MOTION.easeExpo });
  }, [page]);

  const link = "group inline-flex items-center gap-2 text-xs font-medium text-ink transition-colors duration-200";
  const disabled = "inline-flex items-center gap-2 text-xs text-ink-muted/50";

  return (
    <nav aria-label="Halaman katalog" className="mt-20 flex items-center justify-between border-t border-line pt-6 md:mt-28">
      {prevHref ? (
        <Link href={prevHref} className={link} rel="prev">
          <ArrowLeftIcon size={13} className="transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
          Sebelumnya
        </Link>
      ) : (
        <span className={disabled} aria-disabled="true">
          <ArrowLeftIcon size={13} aria-hidden="true" />
          Sebelumnya
        </span>
      )}

      <p className="tabular flex items-center gap-1.5 text-xs text-ink-muted" aria-live="polite">
        <span className="sr-only">Halaman</span>
        <span className="relative inline-block overflow-hidden leading-5">
          <span ref={rollRef} className={cn("inline-block font-medium text-ink")}>
            {page}
          </span>
        </span>
        <span aria-hidden="true">/</span>
        <span className="sr-only">dari</span>
        {pageCount}
      </p>

      {nextHref ? (
        <Link href={nextHref} className={link} rel="next">
          Berikutnya
          <ArrowRightIcon size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      ) : (
        <span className={disabled} aria-disabled="true">
          Berikutnya
          <ArrowRightIcon size={13} aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
