"use client";

import { useEffect } from "react";
import { FULL_MOTION, MOTION } from "@/lib/motion";
import { startCardTransition } from "@/components/motion/card-transition";
import { gsap } from "@/components/motion/gsap";

/**
 * Satu listener untuk semua kartu katalog (event delegation), supaya
 * TemplateCard tetap server component:
 *
 *   - Hover (pointer presisi saja): thumbnail zoom 1.04, halaman isi pertama
 *     memudar di atasnya sebagai pratinjau cepat, dan strip "Lihat demo" naik
 *     dari bawah tepi gambar, 400ms expo.out. Keluar 200ms.
 *   - Fokus keyboard pada kartu: strip demo ikut naik supaya bisa dijangkau Tab.
 *   - Klik kartu: memulai transisi kartu → detail (lihat card-transition.ts).
 */
export function CardMotion() {
  useEffect(() => {
    const motion = window.matchMedia(FULL_MOTION);
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    const parts = (card: Element) => {
      const demo = card.querySelector<HTMLElement>("[data-card-demo]");
      // Ambil alih posisi awal dari CSS (translateY 101%) sekali, sebagai yPercent GSAP.
      if (demo && !demo.dataset.gsapReady) {
        gsap.set(demo, { y: 0, yPercent: 101 });
        demo.dataset.gsapReady = "";
      }
      return {
        image: card.querySelector<HTMLElement>("[data-card-image] > img"),
        preview: card.querySelector<HTMLElement>("[data-card-preview]"),
        demo,
      };
    };

    // Reduced motion: strip demo tetap muncul (fungsinya penting) tapi tanpa gerak; zoom & pratinjau dilewati.
    const enter = (card: Element) => {
      const { image, preview, demo } = parts(card);
      const ease = MOTION.easeExpo;
      if (!motion.matches) {
        if (demo) gsap.set(demo, { yPercent: 0 });
        return;
      }
      if (demo) gsap.to(demo, { yPercent: 0, duration: MOTION.base, ease, overwrite: "auto" });
      if (image) gsap.to(image, { scale: 1.04, duration: MOTION.base, ease, overwrite: "auto" });
      if (preview) gsap.fromTo(preview, { scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: MOTION.base, ease, overwrite: "auto" });
    };

    const leave = (card: Element) => {
      const { image, preview, demo } = parts(card);
      const keepDemo = demo === document.activeElement;
      if (!motion.matches) {
        if (demo && !keepDemo) gsap.set(demo, { yPercent: 101 });
        return;
      }
      if (demo && !keepDemo) gsap.to(demo, { yPercent: 101, duration: MOTION.fast, ease: "power2.in", overwrite: "auto" });
      if (image) gsap.to(image, { scale: 1, duration: MOTION.base, ease: MOTION.ease, overwrite: "auto" });
      if (preview) gsap.to(preview, { autoAlpha: 0, duration: MOTION.fast, ease: "power2.in", overwrite: "auto" });
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !finePointer.matches) return;
      const card = (event.target as Element).closest("[data-card]");
      const from = (event.relatedTarget as Element | null)?.closest?.("[data-card]");
      if (card && card !== from) enter(card);
    };

    const onOut = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const card = (event.target as Element).closest("[data-card]");
      const to = (event.relatedTarget as Element | null)?.closest?.("[data-card]");
      if (card && card !== to) leave(card);
    };

    const onClick = (event: MouseEvent) => {
      // Fase capture: berjalan sebelum <Link> Next.js memanggil preventDefault.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-card-link]");
      const source = link?.closest("[data-card]")?.querySelector<HTMLElement>("[data-card-image]");
      if (link?.dataset.cardLink && source) {
        leave(source.closest("[data-card]")!);
        startCardTransition(link.dataset.cardLink, source);
      }
    };

    // Keyboard: strip demo ikut naik saat difokus, turun lagi saat fokus pergi.
    const onFocusIn = (event: FocusEvent) => {
      const card = (event.target as Element).closest?.("[data-card]");
      if (card && (event.target as Element).matches("[data-card-demo], a[data-card-link]")) enter(card);
    };
    const onFocusOut = (event: FocusEvent) => {
      const card = (event.target as Element).closest?.("[data-card]");
      const next = (event.relatedTarget as Element | null)?.closest?.("[data-card]");
      if (card && card !== next) leave(card);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
