"use client";

import { useEffect } from "react";
import { FINE_POINTER_MOTION, MOTION } from "@/lib/motion";
import { gsap } from "@/components/motion/gsap";

/**
 * Tombol magnetik untuk semua `[data-magnetic]` (event delegation, jadi tombol
 * tetap server component). Saat kursor di atas tombol, tombol mengikuti 30%
 * jarak kursor dari pusatnya (quickTo, 400ms power3.out); saat kursor keluar
 * tombol kembali ke tempatnya. Hanya untuk pointer presisi tanpa reduced motion.
 */
export function MagneticMotion() {
  useEffect(() => {
    const allowed = window.matchMedia(FINE_POINTER_MOTION);
    const movers = new WeakMap<HTMLElement, { x: gsap.QuickToFunc; y: gsap.QuickToFunc }>();
    let current: HTMLElement | null = null;

    const moverFor = (el: HTMLElement) => {
      let mover = movers.get(el);
      if (!mover) {
        mover = {
          x: gsap.quickTo(el, "x", { duration: MOTION.base, ease: MOTION.ease }),
          y: gsap.quickTo(el, "y", { duration: MOTION.base, ease: MOTION.ease }),
        };
        movers.set(el, mover);
      }
      return mover;
    };

    const release = (el: HTMLElement) => {
      const mover = movers.get(el);
      mover?.x(0);
      mover?.y(0);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !allowed.matches) return;
      const target = (event.target as Element).closest<HTMLElement>("[data-magnetic]");
      if (current && current !== target) release(current);
      current = target;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const mover = moverFor(target);
      mover.x((event.clientX - (rect.left + rect.width / 2)) * MOTION.magnet);
      mover.y((event.clientY - (rect.top + rect.height / 2)) * MOTION.magnet);
    };

    const onLeaveWindow = () => {
      if (current) release(current);
      current = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
    };
  }, []);

  return null;
}
