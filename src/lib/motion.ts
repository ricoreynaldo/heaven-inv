/**
 * Token motion (MASTER.md → Motion). Satu-satunya tempat durasi & easing GSAP.
 * Durasi dalam detik (satuan GSAP).
 */
export const MOTION = {
  fast: 0.2,
  base: 0.4,
  slow: 0.6,
  stagger: 0.06,
  ease: "power3.out",
  easeExpo: "expo.out",
  /** Jarak geser elemen yang masuk (px). Kecil: arah, bukan atraksi. */
  rise: 16,
  /** Tombol magnetik: bagian jarak kursor yang diikuti tombol (0.3 = 30%). */
  magnet: 0.3,
  /** Galeri hero: gambar muncul di titik acak, melayang (px), lalu menghilang. */
  heroReveal: 0.9,
  heroHoldMin: 2,
  heroHoldMax: 3.6,
  heroGapMax: 0.8,
  heroDrift: 28,
  easeGentle: "sine.inOut",
} as const;

/** Pointer presisi (mouse/trackpad) dan pengguna tidak meminta reduced motion. */
export const FINE_POINTER_MOTION = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
export const FULL_MOTION = "(prefers-reduced-motion: no-preference)";
