"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import { REDUCED_MOTION } from "@/lib/motion";
import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsap";

/**
 * Garis 2px di paling atas layar yang memanjang sesuai posisi baca halaman
 * (ScrollTrigger dari awal sampai akhir dokumen, scrub langsung). Dibangun
 * ulang tiap pindah halaman karena tinggi dokumen berubah.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const bar = ref.current;
      if (!bar) return;
      const setScale = gsap.quickSetter(bar, "scaleX");
      const reduce = window.matchMedia(REDUCED_MOTION).matches;
      const trigger = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => setScale(self.progress),
        onRefresh: (self) => setScale(self.progress),
      });
      // Halaman di-stream: tunggu konten masuk sebelum mengukur ulang.
      const timer = window.setTimeout(() => ScrollTrigger.refresh(), reduce ? 0 : 400);
      return () => {
        window.clearTimeout(timer);
        trigger.kill();
      };
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-ink"
    />
  );
}
