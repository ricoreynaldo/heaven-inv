"use client";

import { useRef, type ReactNode } from "react";
import { MOTION, REDUCED_MOTION } from "@/lib/motion";
import { Flip, gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsap";

/**
 * Grid katalog yang berpindah layout dengan GSAP Flip saat filter berubah.
 *
 * Alurnya: filter bar memanggil `captureCatalogLayout()` tepat sebelum
 * navigasi, server mengirim hasil baru, lalu grid ini (key item berubah)
 * menganimasikan kartu yang bertahan dari posisi lamanya, dan memudarkan
 * kartu baru. Muat pertama: reveal per baris lewat ScrollTrigger.batch.
 */

const GRID_SELECTOR = "[data-flip-grid]";
const ITEM_SELECTOR = "[data-flip-id]";

let pendingState: Flip.FlipState | null = null;

export function captureCatalogLayout() {
  if (typeof window === "undefined" || window.matchMedia(REDUCED_MOTION).matches) return;
  const items = document.querySelectorAll<HTMLElement>(`${GRID_SELECTOR} ${ITEM_SELECTOR}`);
  pendingState = items.length ? Flip.getState(items, { props: "opacity" }) : null;
}

export function FlipGrid({ itemKeys, className, children }: { itemKeys: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const mounted = useRef(false);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>(ITEM_SELECTOR, ref.current);
      const reduce = window.matchMedia(REDUCED_MOTION).matches;

      if (reduce) {
        gsap.set(items, { autoAlpha: 1, clearProps: "transform" });
        mounted.current = true;
        return;
      }

      if (!mounted.current) {
        mounted.current = true;
        gsap.set(items, { autoAlpha: 0, y: MOTION.rise });
        ScrollTrigger.batch(items, {
          start: "top 94%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: MOTION.base,
              ease: MOTION.ease,
              stagger: MOTION.stagger,
              overwrite: true,
              clearProps: "transform",
            }),
        });
        return;
      }

      const state = pendingState;
      pendingState = null;
      if (state) {
        // Semua kartu terlihat dan di posisi akhirnya dulu (kartu yang belum sempat
        // ter-reveal masih membawa offset y). Yang baru dipudarkan lagi oleh onEnter.
        gsap.set(items, { autoAlpha: 1, y: 0 });
        Flip.from(state, {
          targets: items,
          duration: MOTION.base,
          ease: MOTION.ease,
          // Kartu baru tidak punya posisi lama: cukup muncul pelan.
          onEnter: (entering) =>
            gsap.fromTo(
              entering,
              { autoAlpha: 0, scale: 0.97 },
              { autoAlpha: 1, scale: 1, duration: MOTION.base, ease: MOTION.ease, stagger: MOTION.stagger / 2, clearProps: "transform" },
            ),
        });
      } else {
        gsap.fromTo(
          items,
          { autoAlpha: 0, y: MOTION.rise },
          { autoAlpha: 1, y: 0, duration: MOTION.base, ease: MOTION.ease, stagger: MOTION.stagger, clearProps: "transform" },
        );
      }
      ScrollTrigger.refresh();
    },
    { scope: ref, dependencies: [itemKeys] },
  );

  return (
    <ul ref={ref} data-flip-grid="" className={className}>
      {children}
    </ul>
  );
}
