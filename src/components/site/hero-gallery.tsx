"use client";

import { PauseIcon, PlayIcon } from "@phosphor-icons/react/ssr";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { SmartImage } from "@/components/ui/smart-image";
import { MOTION } from "@/lib/motion";

type Thumbnail = { name: string; thumbnail: string };
type Box = { left: number; top: number; right: number; bottom: number };

/** Kumpulan gambar yang bergiliran tampil; hanya sebagian yang terlihat sekaligus. */
const MAX_IMAGES = 12;
const VISIBLE = { desktop: 6, compact: 3 };
/** Area yang tidak boleh tertutup gambar: judul, teks, CTA, tombol jeda. */
const KEEP_CLEAR = "[data-hero-title], [data-hero-sub], [data-hero-item], .hero-motion-toggle";

function overlaps(a: Box, b: Box) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function boxIn(rect: DOMRect, origin: DOMRect, gap: number): Box {
  return {
    left: rect.left - origin.left - gap,
    top: rect.top - origin.top - gap,
    right: rect.right - origin.left + gap,
    bottom: rect.bottom - origin.top + gap,
  };
}

export function HeroGallery({ images }: { images: Thumbnail[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pool = images
    .filter((image, index, all) => image.thumbnail.trim() && all.findIndex((other) => other.thumbnail === image.thumbnail) === index)
    .slice(0, MAX_IMAGES);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current();
  }, [paused]);

  useGSAP(() => {
    const root = rootRef.current;
    const stage = root?.parentElement;
    if (!root || !stage || !pool.length) return;
    const mm = gsap.matchMedia();

    mm.add({
      desktop: "(min-width: 64rem)",
      compact: "(max-width: 63.999rem)",
      reduced: "(prefers-reduced-motion: reduce)",
    }, (context) => {
      const { desktop, reduced } = context.conditions!;
      const cards = gsap.utils.toArray<HTMLElement>("[data-hero-card]", root);
      const faces = new Map(cards.map((card) => [card, card.querySelector<HTMLElement>("[data-hero-card-image]")!]));
      if (reduced) {
        // Tanpa gerak: tata letak statis dari CSS.
        gsap.set([...faces.values()], { autoAlpha: 1 });
        return;
      }

      // Lepas posisi statis CSS; tiap gambar diberi titik acak saat muncul.
      gsap.set(cards, { display: "block", left: 0, top: 0, xPercent: 0, yPercent: 0, x: 0, y: 0 });
      const live = new Set<gsap.core.Animation>();
      const taken = new Map<HTMLElement, Box>();
      let inView = true;
      const shouldPause = () => pausedRef.current || !inView || document.hidden;
      const track = (animation: gsap.core.Animation) => {
        live.add(animation);
        animation.paused(shouldPause());
      };

      const later = (delay: number) => {
        const call = gsap.delayedCall(delay, () => {
          live.delete(call);
          spawn();
        });
        track(call);
      };

      const spawn = () => {
        const idle = cards.filter((card) => !taken.has(card) && !card.hasAttribute("data-image-error"));
        if (!idle.length) return later(1);
        const card = gsap.utils.random(idle);
        const face = faces.get(card)!;

        // Layout dibaca hanya saat gambar baru muncul, bukan per frame.
        const origin = root.getBoundingClientRect();
        const width = card.offsetWidth;
        const height = card.offsetHeight;
        const edge = 12;
        const drift = MOTION.heroDrift;
        const blocked = [
          ...Array.from(stage.querySelectorAll(KEEP_CLEAR), (el) => boxIn(el.getBoundingClientRect(), origin, 20)),
          ...taken.values(),
        ];
        let spot: Box | undefined;
        for (let tries = 0; tries < 40 && !spot; tries++) {
          const left = gsap.utils.random(edge + drift, Math.max(edge + drift, origin.width - width - edge - drift));
          const top = gsap.utils.random(edge + drift, Math.max(edge + drift, origin.height - height - edge - drift));
          const box = { left: left - drift, top: top - drift, right: left + width + drift, bottom: top + height + drift };
          if (!blocked.some((other) => overlaps(box, other))) spot = box;
        }
        if (!spot) return later(gsap.utils.random(0.4, MOTION.heroGapMax));

        taken.set(card, spot);
        const x = spot.left + drift;
        const y = spot.top + drift;
        const hold = gsap.utils.random(MOTION.heroHoldMin, MOTION.heroHoldMax);
        const fade = MOTION.heroReveal;
        const timeline = gsap.timeline({
          onComplete: () => {
            live.delete(timeline);
            taken.delete(card);
            later(gsap.utils.random(0.2, MOTION.heroGapMax));
          },
        });
        timeline
          .set(card, { x, y, scale: gsap.utils.random(0.88, 1.08) })
          .fromTo(face, { autoAlpha: 0, scale: 0.88 }, { autoAlpha: 1, scale: 1, duration: fade, ease: MOTION.easeExpo }, 0)
          .to(card, {
            x: x + gsap.utils.random(-drift, drift),
            y: y + gsap.utils.random(-drift, drift),
            duration: hold + fade * 2,
            ease: MOTION.easeGentle,
          }, 0)
          .to(face, { autoAlpha: 0, scale: 0.96, duration: fade * 0.8, ease: "power2.in" }, hold + fade);
        track(timeline);
      };

      const count = Math.min(desktop ? VISIBLE.desktop : VISIBLE.compact, cards.length);
      for (let slot = 0; slot < count; slot++) later(0.15 + slot * 0.3);

      const sync = () => {
        const pause = shouldPause();
        live.forEach((animation) => animation.paused(pause));
      };
      syncRef.current = sync;
      const visibility = new IntersectionObserver(([entry]) => {
        inView = entry?.isIntersecting ?? false;
        sync();
      });
      visibility.observe(root);
      document.addEventListener("visibilitychange", sync);

      return () => {
        syncRef.current = () => {};
        visibility.disconnect();
        document.removeEventListener("visibilitychange", sync);
        live.forEach((animation) => animation.kill());
        gsap.set([...cards, ...faces.values()], { clearProps: "all" });
      };
    });
    return () => mm.revert();
  }, { scope: rootRef, dependencies: [images] });

  if (!pool.length) return null;

  return (
    <>
      <div ref={rootRef} className="hero-media" aria-hidden="true">
        {pool.map((image) => (
          <div key={image.thumbnail} data-hero-card="" className="hero-card">
            <div data-hero-card-image="" className="hero-card-image">
              <SmartImage
                src={image.thumbnail}
                alt=""
                fill
                loading="eager"
                sizes="(max-width: 639px) 104px, (max-width: 1023px) 140px, (max-width: 1440px) 13vw, 184px"
                className="object-cover"
                onLoad={(event) => event.currentTarget.closest("[data-hero-card]")?.removeAttribute("data-image-error")}
                onError={(event) => {
                  const card = event.currentTarget.closest<HTMLElement>("[data-hero-card]");
                  card?.setAttribute("data-image-error", "true");
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="hero-motion-toggle meta-caps inline-flex min-h-11 items-center gap-2 text-ink-muted transition-colors hover:text-ink"
        aria-label={paused ? "Putar animasi gambar" : "Jeda animasi gambar"}
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? <PlayIcon size={13} aria-hidden="true" /> : <PauseIcon size={13} aria-hidden="true" />}
        {paused ? "Putar" : "Jeda"}
      </button>
    </>
  );
}
