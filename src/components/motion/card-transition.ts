"use client";

import { MOTION, REDUCED_MOTION } from "@/lib/motion";
import { gsap } from "@/components/motion/gsap";

/**
 * Transisi kartu → detail (shared element).
 *
 * Saat kartu diklik, salinan thumbnail dipasang `position: fixed` tepat di
 * atas kartu dan bertahan selama navigasi. Begitu galeri detail mount, salinan
 * terbang ke posisi gambar utama (transform saja, rasio 4:5 sama sehingga
 * skala seragam), lalu dilepas. Bila detail tidak pernah mount, salinan
 * dipudarkan otomatis.
 */

type Pending = { slug: string; clone: HTMLElement; rect: DOMRect; timeout: number };

let pending: Pending | null = null;

function dispose(fade: boolean) {
  const current = pending;
  if (!current) return;
  pending = null;
  window.clearTimeout(current.timeout);
  if (fade) gsap.to(current.clone, { autoAlpha: 0, duration: MOTION.fast, ease: "power2.in", onComplete: () => current.clone.remove() });
  else current.clone.remove();
}

export function startCardTransition(slug: string, source: HTMLElement) {
  if (window.matchMedia(REDUCED_MOTION).matches) return;
  const img = source.querySelector("img");
  if (!img?.currentSrc) return;
  dispose(false);

  const rect = source.getBoundingClientRect();
  const clone = document.createElement("div");
  clone.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    zIndex: "60",
    overflow: "hidden",
    borderRadius: getComputedStyle(source).borderRadius,
    pointerEvents: "none",
    backgroundImage: `url("${img.currentSrc}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transformOrigin: "0 0",
    willChange: "transform",
  });
  document.body.appendChild(clone);
  // Halaman detail mungkin lambat atau navigasi dibatalkan: jangan tinggalkan salinan.
  const timeout = window.setTimeout(() => dispose(true), 4000);
  pending = { slug, clone, rect, timeout };
}

/**
 * Dipanggil galeri detail saat mount. Mengembalikan true bila transisi
 * berjalan (gambar target harus disembunyikan sampai onDone).
 */
export function finishCardTransition(slug: string, target: HTMLElement, onDone: () => void): boolean {
  const current = pending;
  if (!current || current.slug !== slug) {
    dispose(true);
    return false;
  }
  pending = null;
  window.clearTimeout(current.timeout);

  const to = target.getBoundingClientRect();
  const { clone, rect: from } = current;
  // Pasang di ukuran tujuan, lalu animasikan dari bentuk kartu (FLIP manual).
  Object.assign(clone.style, {
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
    borderRadius: getComputedStyle(target).borderRadius,
  });
  gsap.fromTo(
    clone,
    { x: from.left - to.left, y: from.top - to.top, scale: from.width / to.width },
    {
      x: 0,
      y: 0,
      scale: 1,
      duration: MOTION.slow,
      ease: MOTION.easeExpo,
      onComplete: () => {
        onDone();
        gsap.to(clone, { autoAlpha: 0, duration: MOTION.fast, ease: "power2.in", onComplete: () => clone.remove() });
      },
    },
  );
  return true;
}
