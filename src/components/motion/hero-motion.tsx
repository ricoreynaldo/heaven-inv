"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/components/motion/gsap";
import { FINE_POINTER_MOTION, FULL_MOTION, MOTION, REDUCED_MOTION } from "@/lib/motion";

/** Layar ≥768px tanpa reduced motion: animasi spasi huruf aman (baris judul tidak patah). */
const WIDE_MOTION = "(min-width: 48rem) and (prefers-reduced-motion: no-preference)";

/**
 * Hero lookbook (thesis v5):
 *   1. Huruf judul menyala dalam urutan acak (SplitText chars, ±1s) sementara
 *      spasi hurufnya merapat dari 0.42em ke 0.12em (1.8s expo.out, layar lebar).
 *   2. Subjudul abu-abu merapat dari 0.5em dan memudar masuk.
 *   3. `[data-hero-item]` (link, kolom pojok) fade + naik 10px berurutan.
 * Gambar di pojok kanan bawah berganti tiap MOTION.heroCycle detik (memudar),
 * berhenti saat hero di luar layar atau disorot. Mouse di atas judul: spasi
 * huruf melebar ke 0.18em. Reduced motion: semua tampil, gambar tidak berganti.
 */
export function HeroMotion({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const title = root.querySelector<HTMLElement>("[data-hero-title]");
      const sub = root.querySelector<HTMLElement>("[data-hero-sub]");
      const items = gsap.utils.toArray<HTMLElement>("[data-hero-item]", root);
      const slides = gsap.utils.toArray<HTMLElement>("[data-hero-slide]", root);
      const captions = gsap.utils.toArray<HTMLElement>("[data-hero-caption]", root);
      const corner = root.querySelector<HTMLElement>("[data-hero-corner]");
      const mm = gsap.matchMedia();

      mm.add(FULL_MOTION, () => {
        if (title) {
          gsap.set(title, { autoAlpha: 1 });
          const split = SplitText.create(title, { type: "words,chars" });
          gsap.from(split.chars, { opacity: 0, duration: 0.6, ease: "power2.out", stagger: { amount: 0.9, from: "random" }, delay: 0.1 });
        }
        if (sub) gsap.fromTo(sub, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: MOTION.ease, delay: 0.6 });
        if (items.length) {
          gsap.fromTo(
            items,
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: MOTION.slow, ease: MOTION.ease, stagger: 0.08, delay: 0.9, clearProps: "transform" },
          );
        }

        // Gambar pojok bergiliran, hanya saat hero terlihat dan tidak disorot.
        if (slides.length < 2) return;
        let current = 0;
        gsap.set([...slides.slice(1), ...captions.slice(1)], { autoAlpha: 0 });
        const advance = () => {
          const previous = current;
          current = (current + 1) % slides.length;
          // Gambar memudar silang; nama bergantian (lama hilang dulu) supaya tidak bertumpuk.
          gsap.to(slides[previous]!, { autoAlpha: 0, duration: 0.8, ease: MOTION.ease });
          gsap.fromTo(slides[current]!, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: MOTION.ease });
          if (captions[previous]) gsap.to(captions[previous], { autoAlpha: 0, duration: 0.3, ease: "power2.in" });
          if (captions[current]) gsap.fromTo(captions[current], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: MOTION.ease, delay: 0.3 });
        };
        const timer = gsap.delayedCall(MOTION.heroCycle, function tick() {
          advance();
          timer.restart(true);
        });
        let inView = true;
        let hovered = false;
        const sync = () => timer.paused(!inView || hovered);
        const visibility = ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            inView = self.isActive;
            sync();
          },
        });
        const enter = () => {
          hovered = true;
          sync();
        };
        const leave = () => {
          hovered = false;
          sync();
        };
        corner?.addEventListener("pointerenter", enter);
        corner?.addEventListener("pointerleave", leave);
        return () => {
          timer.kill();
          visibility.kill();
          corner?.removeEventListener("pointerenter", enter);
          corner?.removeEventListener("pointerleave", leave);
        };
      });

      // Spasi huruf merapat saat masuk (layar lebar: baris judul tidak patah ulang).
      mm.add(WIDE_MOTION, () => {
        if (title) gsap.from(title, { letterSpacing: "0.42em", duration: 1.8, ease: MOTION.easeExpo, delay: 0.1, clearProps: "letterSpacing" });
        if (sub) gsap.from(sub, { letterSpacing: "0.5em", duration: 1.8, ease: MOTION.easeExpo, delay: 0.5, clearProps: "letterSpacing" });
      });

      // Mouse di atas judul: spasi huruf melebar sedikit.
      mm.add(`${FINE_POINTER_MOTION} and (min-width: 48rem)`, () => {
        if (!title) return;
        const grow = () => gsap.to(title, { letterSpacing: "0.18em", duration: 0.9, ease: MOTION.easeExpo, overwrite: "auto" });
        const shrink = () => gsap.to(title, { letterSpacing: "0.12em", duration: 0.9, ease: MOTION.easeExpo, overwrite: "auto", clearProps: "letterSpacing" });
        title.addEventListener("pointerenter", grow);
        title.addEventListener("pointerleave", shrink);
        return () => {
          title.removeEventListener("pointerenter", grow);
          title.removeEventListener("pointerleave", shrink);
        };
      });

      mm.add(REDUCED_MOTION, () => {
        gsap.set([title, sub, ...items].filter(Boolean), { autoAlpha: 1 });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
