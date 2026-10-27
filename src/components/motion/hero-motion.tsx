"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { FULL_MOTION, MOTION, REDUCED_MOTION } from "@/lib/motion";

/** Reveal singkat untuk copy; seluruh gerak gambar terisolasi di HeroGallery. */
export function HeroMotion({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = ref.current;
    if (!root) return;
    const title = root.querySelector<HTMLElement>("[data-hero-title]");
    const sub = root.querySelector<HTMLElement>("[data-hero-sub]");
    const items = gsap.utils.toArray<HTMLElement>("[data-hero-item]", root);
    const targets = [title, sub, ...items].filter((item): item is HTMLElement => Boolean(item));
    const mm = gsap.matchMedia();

    mm.add(FULL_MOTION, () => {
      gsap.fromTo(targets,
        { autoAlpha: 0, y: MOTION.rise },
        { autoAlpha: 1, y: 0, duration: MOTION.slow, ease: MOTION.easeExpo, stagger: MOTION.stagger, clearProps: "transform" },
      );
    });
    mm.add(REDUCED_MOTION, () => {
      gsap.set(targets, { autoAlpha: 1 });
    });
    return () => mm.revert();
  }, { scope: ref });

  return <div ref={ref} className={className}>{children}</div>;
}
