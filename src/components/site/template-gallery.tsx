"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import { useRef, useState } from "react";
import { finishCardTransition } from "@/components/motion/card-transition";
import { gsap, Observer, useGSAP } from "@/components/motion/gsap";
import { SmartImage } from "@/components/ui/smart-image";
import { MOTION, REDUCED_MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Jarak geser slide saat berganti (persen lebar), cukup untuk memberi arah. */
const SHIFT = 6;
/** Swipe minimal (px) agar dihitung berpindah gambar. */
const SWIPE = 40;

/**
 * Galeri detail. Slide ditumpuk; pergantian = slide lama memudar ke arah
 * berlawanan, slide baru masuk 6% dari sisi tujuan (400ms power3.out).
 * Swipe/drag lewat GSAP Observer, tombol, thumbnail, dan panah keyboard.
 * Gambar pertama menjadi tujuan transisi kartu → detail.
 */
export function TemplateGallery({ images, name, slug }: { images: string[]; name: string; slug: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  // Handler event biasa (bukan render): tween dibuat saat diklik/di-swipe.
  function go(index: number) {
    const from = activeRef.current;
    const to = Math.max(0, Math.min(images.length - 1, index));
    if (to === from) return;
    const slides = gsap.utils.toArray<HTMLElement>("[data-slide]", stageRef.current);
    const outgoing = slides[from];
    const incoming = slides[to];
    if (!outgoing || !incoming) return;
    activeRef.current = to;
    setActive(to);

    if (window.matchMedia(REDUCED_MOTION).matches) {
      gsap.set(outgoing, { autoAlpha: 0 });
      gsap.set(incoming, { autoAlpha: 1, xPercent: 0 });
      return;
    }
    const direction = to > from ? 1 : -1;
    gsap.to(outgoing, { autoAlpha: 0, xPercent: -direction * SHIFT, duration: MOTION.base, ease: MOTION.ease, overwrite: true });
    gsap.fromTo(
      incoming,
      { autoAlpha: 0, xPercent: direction * SHIFT },
      { autoAlpha: 1, xPercent: 0, duration: MOTION.base, ease: MOTION.ease, overwrite: true },
    );
  }

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;

      // Tujuan transisi kartu → detail: sembunyikan gambar sampai salinannya mendarat.
      const running = finishCardTransition(slug, stage, () => gsap.set(stage, { autoAlpha: 1 }));
      if (running) gsap.set(stage, { autoAlpha: 0 });

      if (images.length < 2) return;
      const observer = Observer.create({
        target: stage,
        type: "touch,pointer",
        dragMinimum: 3,
        onRelease: (self) => {
          const dx = self.x! - self.startX!;
          if (Math.abs(dx) >= SWIPE) go(activeRef.current + (dx < 0 ? 1 : -1));
        },
      });
      return () => observer.kill();
    },
    { scope: rootRef, dependencies: [slug, images.length] },
  );

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={`Galeri ${name}`}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(active + 1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(active - 1);
        }
      }}
    >
      <div className="relative">
        <div
          ref={stageRef}
          tabIndex={0}
          aria-label="Gunakan panah kiri dan kanan untuk berpindah gambar"
          className="relative aspect-[4/5] cursor-grab touch-pan-y select-none overflow-hidden rounded-inner bg-canvas outline-offset-4 active:cursor-grabbing"
        >
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              data-slide=""
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} dari ${images.length}`}
              aria-hidden={index !== active}
              className={cn("absolute inset-0", index !== 0 && "invisible opacity-0")}
            >
              <SmartImage
                src={src}
                alt={index === 0 ? `Cover undangan ${name}` : `Tampilan ${name}, bagian ${index + 1}`}
                fill
                draggable={false}
                preload={index === 0}
                loading={index === 0 ? undefined : "lazy"}
                sizes="(min-width: 1024px) 50vw, 94vw"
                className="pointer-events-none object-cover"
              />
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(active - 1)}
              disabled={active === 0}
              aria-label="Gambar sebelumnya"
              className="absolute left-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-control bg-surface text-ink ring-1 ring-line transition-[opacity,transform] duration-200 hover:scale-105 active:scale-95 disabled:opacity-0 sm:grid"
            >
              <CaretLeftIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              disabled={active === images.length - 1}
              aria-label="Gambar berikutnya"
              className="absolute right-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-control bg-surface text-ink ring-1 ring-line transition-[opacity,transform] duration-200 hover:scale-105 active:scale-95 disabled:opacity-0 sm:grid"
            >
              <CaretRightIcon size={18} />
            </button>
            <p
              className="tabular pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-control bg-ink/75 px-3 py-1 text-xs font-medium text-surface sm:hidden"
              aria-hidden="true"
            >
              {active + 1} / {images.length}
            </p>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={`thumb-${src}-${index}`}
              type="button"
              onClick={() => go(index)}
              aria-label={`Tampilkan gambar ${index + 1} dari ${images.length}`}
              aria-current={active === index}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-inner ring-2 ring-offset-2 ring-offset-canvas transition-[opacity,box-shadow] duration-200 md:w-20",
                active === index ? "ring-ink" : "opacity-60 ring-transparent hover:opacity-100",
              )}
            >
              <SmartImage src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
