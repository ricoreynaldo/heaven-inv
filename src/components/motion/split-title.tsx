"use client";

import { useRef, type ReactNode } from "react";
import { gsap, SplitText, useGSAP } from "@/components/motion/gsap";
import { FULL_MOTION, REDUCED_MOTION } from "@/lib/motion";

/**
 * Judul kapital berspasi lebar yang hurufnya menyala satu per satu dalam urutan
 * acak saat masuk layar (SplitText chars, 500ms per huruf, total ±0.9s).
 * Kata tetap utuh saat baris patah. Reduced motion: tampil langsung.
 */
export function SplitTitle({
  as: Tag = "h2",
  id,
  className,
  children,
  start = "top 88%",
}: {
  as?: "h1" | "h2" | "h3" | "p";
  id?: string;
  className?: string;
  children: ReactNode;
  start?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        gsap.set(el, { autoAlpha: 1 });
        const split = SplitText.create(el, { type: "words,chars" });
        gsap.from(split.chars, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: { amount: 0.6, from: "random" },
          scrollTrigger: { trigger: el, start, once: true },
        });
        return () => split.revert();
      });
      mm.add(REDUCED_MOTION, () => {
        gsap.set(el, { autoAlpha: 1 });
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} data-split-title="" className={className}>
      {children}
    </Tag>
  );
}
