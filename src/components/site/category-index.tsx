"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { SmartImage } from "@/components/ui/smart-image";
import type { CategoryCardData } from "@/lib/data/public";
import { FINE_POINTER_MOTION, MOTION } from "@/lib/motion";

function countLabel(category: CategoryCardData) {
  return category.templateCount > 0 ? `${category.templateCount}` : "Segera";
}

/**
 * Daftar kategori lookbook (thesis v5): nama kapital berspasi lebar ditumpuk di
 * tengah, jumlah undangan kecil di sampingnya. Pointer presisi: nama lain
 * meredup (CSS) dan gambar kategori mengikuti kursor (quickTo 600ms, miring
 * sesuai kecepatan gerak) dengan pudar silang saat berpindah baris.
 */
export function CategoryIndex({ categories }: { categories: CategoryCardData[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const preview = root.querySelector<HTMLElement>("[data-cat-preview]");
      const slides = gsap.utils.toArray<HTMLElement>("[data-cat-slide]", root);
      const rows = gsap.utils.toArray<HTMLElement>("[data-cat-row]", root);
      const mm = gsap.matchMedia();

      mm.add(FINE_POINTER_MOTION, () => {
        if (!preview) return;
        gsap.set(preview, { autoAlpha: 0, scale: 0.92, xPercent: -50, yPercent: -50 });
        gsap.set(slides, { autoAlpha: 0 });
        const xTo = gsap.quickTo(preview, "x", { duration: 0.6, ease: MOTION.ease });
        const yTo = gsap.quickTo(preview, "y", { duration: 0.6, ease: MOTION.ease });
        const tilt = gsap.quickTo(preview, "rotation", { duration: 0.8, ease: MOTION.ease });
        let lastX = 0;
        let active = -1;

        const place = (event: PointerEvent, instant = false) => {
          const rect = root.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          if (instant) gsap.set(preview, { x, y });
          else {
            xTo(x);
            yTo(y);
          }
        };
        const onMove = (event: PointerEvent) => {
          place(event);
          tilt(gsap.utils.clamp(-8, 8, (event.clientX - lastX) * 0.4));
          lastX = event.clientX;
        };
        const onEnterList = (event: PointerEvent) => {
          place(event, true);
          lastX = event.clientX;
          gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.5, ease: MOTION.easeExpo, overwrite: "auto" });
        };
        const onLeaveList = () => {
          gsap.to(preview, { autoAlpha: 0, scale: 0.92, duration: 0.3, ease: MOTION.ease, overwrite: "auto" });
          tilt(0);
          active = -1;
        };

        const cleanups = rows.map((row, index) => {
          const enter = () => {
            if (index === active) return;
            const previous = slides[active];
            active = index;
            if (previous) gsap.to(previous, { autoAlpha: 0, duration: 0.4, ease: MOTION.ease, overwrite: true });
            const slide = slides[index];
            if (slide) gsap.to(slide, { autoAlpha: 1, duration: 0.4, ease: MOTION.ease, overwrite: true });
          };
          row.addEventListener("pointerenter", enter);
          return () => row.removeEventListener("pointerenter", enter);
        });

        root.addEventListener("pointermove", onMove);
        root.addEventListener("pointerenter", onEnterList);
        root.addEventListener("pointerleave", onLeaveList);
        return () => {
          cleanups.forEach((cleanup) => cleanup());
          root.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerenter", onEnterList);
          root.removeEventListener("pointerleave", onLeaveList);
        };
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative mx-auto w-fit">
      <ul className="group/list flex flex-col items-center gap-1 md:gap-2">
        {categories.map((category) => (
          <li key={category.id} data-reveal="">
            <Link
              href={`/catalog?category=${category.slug}`}
              data-cat-row=""
              className="group/row relative z-20 inline-block px-2 py-1.5"
            >
              <span className="title-caps text-[1.375rem] text-ink transition-colors duration-300 group-hover/list:text-ink/20 group-hover/row:text-ink! md:text-[2rem]">
                {category.name}
              </span>
              {/* Angka di luar aliran teks supaya nama tetap tepat di tengah. */}
              <span className="meta-caps tabular absolute left-full top-1.5 text-ink-muted">
                <span className="sr-only">, </span>
                {countLabel(category)}
                <span className="sr-only">{category.templateCount > 0 ? " undangan" : " hadir"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Gambar yang mengikuti kursor (hanya pointer presisi), di belakang teks. */}
      <div
        data-cat-preview=""
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 z-10 hidden aspect-[4/5] w-44 overflow-hidden bg-canvas opacity-0 [@media(hover:hover)_and_(pointer:fine)]:block lg:w-52"
      >
        {categories.map((category) =>
          category.image ? (
            <span key={category.id} data-cat-slide="" className="absolute inset-0">
              <SmartImage src={category.image} alt="" fill sizes="208px" className="object-cover" />
            </span>
          ) : (
            <span key={category.id} data-cat-slide="" className="absolute inset-0 bg-accent-soft" />
          ),
        )}
      </div>
    </div>
  );
}
