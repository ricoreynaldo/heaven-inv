"use client";

import { ArrowUpRightIcon, InstagramLogoIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "@/components/motion/gsap";
import { MOTION, REDUCED_MOTION } from "@/lib/motion";

export const MENU_LINKS = [
  { href: "/catalog", label: "Katalog" },
  { href: "/catalog?tag=best-seller", label: "Best Seller" },
  { href: "/#kategori", label: "Kategori" },
  { href: "/#cara-pesan", label: "Cara Pesan" },
  { href: "/#faq", label: "FAQ" },
];

/**
 * Menu layar penuh (link kapital berspasi lebar, thesis v5) yang membesar melingkar dari ikon menu
 * (clip-path circle dari pusat tombol, 700ms expo.out), lalu link naik
 * berurutan (stagger 60ms). Menutup menyusut kembali ke tombol (400ms
 * power3.in). Reduced motion: muncul/hilang tanpa gerak.
 * clip-path memicu repaint (bukan reflow) dan hanya untuk satu elemen ini.
 */
export function MenuOverlay({
  open,
  onClose,
  originRef,
  categories,
  consultUrl,
  instagramUrl,
}: {
  open: boolean;
  onClose: () => void;
  originRef: RefObject<HTMLElement | null>;
  categories: { slug: string; name: string }[];
  consultUrl: string | null;
  instagramUrl: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const shown = useRef(false);

  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    if (!open && !shown.current) return;
    const reduce = window.matchMedia(REDUCED_MOTION).matches;
    const rect = originRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : 40;
    const cy = rect ? rect.top + rect.height / 2 : 32;
    const radius = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
    const closed = `circle(0px at ${cx}px ${cy}px)`;
    const full = `circle(${radius}px at ${cx}px ${cy}px)`;
    const items = panel.querySelectorAll<HTMLElement>("[data-menu-item]");

    if (open) {
      shown.current = true;
      if (reduce) {
        gsap.set(panel, { autoAlpha: 1, clipPath: "none" });
        gsap.set(items, { opacity: 1, y: 0 });
      } else {
        gsap
          .timeline()
          .fromTo(panel, { autoAlpha: 1, clipPath: closed }, { clipPath: full, duration: 0.7, ease: MOTION.easeExpo })
          // opacity (bukan autoAlpha): link harus tetap bisa difokus selama animasi masuk.
          .fromTo(items, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: MOTION.base, ease: MOTION.ease, stagger: MOTION.stagger }, 0.15);
      }
      firstLinkRef.current?.focus({ preventScroll: true });
    } else if (reduce) {
      gsap.set(panel, { autoAlpha: 0 });
    } else {
      gsap
        .timeline()
        .to(items, { opacity: 0, duration: MOTION.fast, ease: "power2.in" })
        .to(panel, { clipPath: closed, duration: MOTION.base, ease: "power3.in" }, 0.05)
        .set(panel, { autoAlpha: 0 });
    }
  }, [open, originRef]);

  // Kunci scroll halaman & Esc selama menu terbuka.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!open}
      className="invisible fixed inset-0 z-[45] overflow-y-auto bg-ink text-surface opacity-0"
    >
      <div className="container-page grid min-h-dvh gap-12 pb-12 pt-28 md:grid-cols-12 md:pt-32">
        <nav aria-label="Menu utama" className="md:col-span-7">
          <ul className="space-y-2 md:space-y-3">
            {MENU_LINKS.map((link, index) => (
              <li key={link.href} data-menu-item="">
                <Link
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={link.href}
                  onClick={onClose}
                  className="group title-caps inline-flex items-baseline py-1 text-[1.75rem] text-surface/85 transition-colors duration-200 hover:text-surface md:text-[2.5rem]"
                >
                  <span className="relative">
                    {link.label}
                    <span className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-0 bg-surface/60 transition-transform duration-400 ease-expo group-hover:scale-x-100" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-10 md:col-span-4 md:col-start-9 md:pt-3">
          {categories.length > 0 ? (
            <div data-menu-item="">
              <p className="meta-caps text-surface/50">Kategori</p>
              <ul className="mt-4 space-y-1">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/catalog?category=${category.slug}`}
                      onClick={onClose}
                      className="group meta-caps inline-flex items-center gap-1.5 text-surface/75 transition-colors hover:text-surface"
                    >
                      {category.name}
                      <ArrowUpRightIcon size={12} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div data-menu-item="" className="flex flex-col gap-1">
            <p className="meta-caps mb-3 text-surface/50">Hubungi</p>
            {consultUrl ? (
              <a href={consultUrl} target="_blank" rel="noopener noreferrer" className="meta-caps inline-flex items-center gap-2 text-surface/75 hover:text-surface">
                <WhatsappLogoIcon size={14} aria-hidden="true" />
                Konsultasi via WhatsApp
              </a>
            ) : null}
            {instagramUrl ? (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="meta-caps inline-flex items-center gap-2 text-surface/75 hover:text-surface">
                <InstagramLogoIcon size={14} aria-hidden="true" />
                Instagram
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
