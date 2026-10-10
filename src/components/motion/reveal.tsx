"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { FULL_MOTION, MOTION, REDUCED_MOTION } from "@/lib/motion";
import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsap";

/**
 * Reveal sekali saat masuk layar untuk setiap `[data-reveal]` di dalamnya,
 * dikelompokkan per baris oleh ScrollTrigger.batch (stagger 60ms).
 * Elemen disembunyikan oleh CSS (html.js-motion) sebelum hidrasi supaya tidak
 * berkedip; dengan reduced motion semuanya langsung tampil tanpa gerak.
 */
export function Reveal({
  as: Tag = "div",
  className,
  children,
  start = "top 92%",
  onMount = false,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  start?: string;
  /** true: langsung stagger saat mount tanpa ScrollTrigger (konten di atas fold / sticky). */
  onMount?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", ref.current);
      if (items.length === 0) return;
      const mm = gsap.matchMedia();

      mm.add(FULL_MOTION, () => {
        gsap.set(items, { autoAlpha: 0, y: MOTION.rise });
        if (onMount) {
          gsap.to(items, {
            autoAlpha: 1,
            y: 0,
            duration: MOTION.base,
            ease: MOTION.ease,
            stagger: MOTION.stagger,
            delay: 0.15,
            clearProps: "transform",
          });
          return;
        }
        ScrollTrigger.batch(items, {
          start,
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
      });

      mm.add(REDUCED_MOTION, () => {
        gsap.set(items, { autoAlpha: 1, clearProps: "transform" });
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
