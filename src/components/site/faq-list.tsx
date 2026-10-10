"use client";

import type { SyntheticEvent } from "react";
import { Reveal } from "@/components/motion/reveal";
import { gsap } from "@/components/motion/gsap";
import type { FaqItem } from "@/lib/content/schema";
import { MOTION, REDUCED_MOTION } from "@/lib/motion";

/**
 * Akordeon FAQ di atas <details> native: bisa dibuka dengan keyboard dan tanpa
 * JS, dan `name` yang sama membuat hanya satu jawaban terbuka sekaligus.
 * Saat dibuka, jawaban turun 6px sambil memudar masuk (400ms power3.out).
 * Tinggi tidak dianimasikan: konten di bawahnya langsung bergeser.
 */
function onToggle(event: SyntheticEvent<HTMLDetailsElement>) {
  const details = event.currentTarget;
  if (!details.open || window.matchMedia(REDUCED_MOTION).matches) return;
  const answer = details.querySelector<HTMLElement>("[data-faq-answer]");
  if (answer) gsap.fromTo(answer, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: MOTION.base, ease: MOTION.ease, clearProps: "transform" });
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <Reveal className="border-t border-line">
      {items.map((item, index) => (
        <details key={`${item.question}-${index}`} data-reveal="" name="faq" onToggle={onToggle} className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 rounded-inner py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className="text-[0.9375rem] font-medium leading-snug text-ink transition-colors duration-200 group-hover:text-ink-soft">
              {item.question}
            </span>
            {/* Plus menjadi minus: garis tegak berputar 90° dan menimpa garis datar. */}
            <span
              aria-hidden="true"
              className="relative mt-1 grid size-5 shrink-0 place-items-center text-ink"
            >
              <span className="absolute h-px w-3 bg-current" />
              <span className="absolute h-3 w-px bg-current transition-transform duration-200 ease-out group-open:rotate-90" />
            </span>
          </summary>
          <div data-faq-answer="" className="space-y-3 pb-6 pr-12 text-sm leading-relaxed text-ink-soft">
            {item.answer
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
          </div>
        </details>
      ))}
    </Reveal>
  );
}
