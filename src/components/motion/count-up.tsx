"use client";

import { useRef } from "react";
import { MOTION, REDUCED_MOTION } from "@/lib/motion";
import { gsap, useGSAP } from "@/components/motion/gsap";

/**
 * Angka yang menghitung naik dari 0 saat pertama tampil (800ms power3.out,
 * dibulatkan ke bilangan bulat). Server merender angka akhirnya, jadi tanpa
 * JS atau dengan reduced motion angka langsung benar.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || value <= 0 || window.matchMedia(REDUCED_MOTION).matches) return;
      const counter = { n: 0 };
      gsap.to(counter, {
        n: value,
        duration: MOTION.slow + 0.2,
        ease: MOTION.ease,
        snap: { n: 1 },
        onUpdate: () => {
          el.textContent = String(counter.n);
        },
      });
    },
    { dependencies: [value] },
  );

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
