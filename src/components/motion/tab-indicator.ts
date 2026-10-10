"use client";

import { useEffect, useRef, type RefObject } from "react";
import { MOTION, REDUCED_MOTION } from "@/lib/motion";
import { gsap } from "@/components/motion/gsap";

/**
 * Indikator tab yang meluncur ke tab aktif (400ms power3.out).
 *
 * Kontainer: `relative` + berisi satu `[data-tab-indicator]` (absolute, left-0)
 * dan tab-tab dengan `aria-selected="true"` atau `aria-pressed="true"` untuk
 * yang aktif. Setelah indikator pertama kali terpasang, kontainer diberi
 * `data-ready` supaya gaya aktif bawaan tab (fallback tanpa JS) dimatikan.
 * Indikator bergerak lewat `x` (transform); lebarnya di-set pada elemen
 * absolute yang terisolasi, jadi tidak memicu reflow elemen lain.
 */
function place(container: HTMLElement, animate: boolean) {
  const indicator = container.querySelector<HTMLElement>(":scope > [data-tab-indicator]");
  if (!indicator) return;
  const active = container.querySelector<HTMLElement>(':scope > [aria-selected="true"], :scope > [aria-pressed="true"]');
  if (!active) {
    gsap.to(indicator, { autoAlpha: 0, duration: animate ? MOTION.fast : 0, overwrite: true });
    return;
  }
  const target = { x: active.offsetLeft, width: active.offsetWidth, autoAlpha: 1 };
  if (!animate || window.matchMedia(REDUCED_MOTION).matches) gsap.set(indicator, { ...target, overwrite: true });
  else gsap.to(indicator, { ...target, duration: MOTION.base, ease: MOTION.ease, overwrite: true });
  container.dataset.ready = "";
}

export function useTabIndicator(containerRef: RefObject<HTMLElement | null>, activeKey: string) {
  const mounted = useRef(false);

  // Pasang pertama kali tanpa animasi, lalu ikuti perubahan ukuran (resize, font
  // selesai dimuat) juga tanpa animasi. ResizeObserver selalu memanggil sekali
  // saat mulai diamati; itu sengaja dipakai sebagai pemasangan awal.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let alive = true;
    void document.fonts?.ready.then(() => alive && place(container, false));
    const observer = new ResizeObserver(() => place(container, false));
    observer.observe(container);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [containerRef]);

  // Tab aktif berganti: meluncur.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!mounted.current) {
      mounted.current = true;
      place(container, false);
      return;
    }
    place(container, true);
  }, [containerRef, activeKey]);
}
