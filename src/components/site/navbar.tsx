"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { BrandMark } from "@/components/site/brand-mark";
import { MenuOverlay } from "@/components/site/menu-overlay";
import { SearchOverlay } from "@/components/site/search-overlay";
import type { SearchItem } from "@/lib/data/public";
import { FULL_MOTION, MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Link teks di header layar lebar (thesis v5, seperti header lookbook). */
const NAV_LINKS = [
  { href: "/catalog", label: "Katalog" },
  { href: "/catalog?tag=best-seller", label: "Best Seller" },
];

/**
 * Header lookbook (thesis v5): nama brand di kiri, link teks kecil kapital
 * tersebar merata, lalu WhatsApp dan ikon menu di kanan. Layar kecil: brand,
 * ikon cari, ikon menu. Menu membesar melingkar dari ikonnya; pencarian instan
 * turun dari atas. Header menyingkir saat scroll turun.
 */
export function Navbar({
  brandName,
  logo,
  consultUrl,
  instagramUrl,
  categories,
  searchIndex,
}: {
  brandName: string;
  logo: string;
  consultUrl: string | null;
  instagramUrl: string | null;
  categories: { slug: string; name: string }[];
  searchIndex: SearchItem[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchIconRef = useRef<HTMLButtonElement>(null);
  const lockRef = useRef(false);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus({ preventScroll: true });
  }, []);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    // Kembalikan fokus ke tombol cari yang sedang terlihat (teks di layar lebar, ikon di HP).
    const visible = [searchButtonRef.current, searchIconRef.current].find((button) => button && button.offsetParent !== null);
    visible?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    lockRef.current = menuOpen || searchOpen;
  }, [menuOpen, searchOpen]);

  // Garis bawah header baru muncul setelah halaman digulir sedikit.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" membuka pencarian dari mana saja (kecuali sedang mengetik).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== "/" || event.metaKey || event.ctrlKey || target.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      setMenuOpen(false);
      setSearchOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /*
   * Navbar menyingkir saat scroll turun dan kembali saat scroll naik (300ms
   * power3.out). Selalu terlihat di 120px teratas, saat menu/pencarian terbuka,
   * dan saat ada fokus keyboard di dalamnya. Tidak menyingkir dengan reduced motion.
   */
  useGSAP(() => {
    const header = headerRef.current;
    if (!header) return;
    const mm = gsap.matchMedia();
    mm.add(FULL_MOTION, () => {
      let hidden = false;
      const show = () => {
        if (!hidden) return;
        hidden = false;
        gsap.to(header, { yPercent: 0, duration: 0.3, ease: MOTION.ease, overwrite: "auto" });
      };
      const hide = () => {
        if (hidden) return;
        hidden = true;
        gsap.to(header, { yPercent: -100, duration: 0.25, ease: "power2.in", overwrite: "auto" });
      };
      const trigger = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          if (lockRef.current || self.scroll() < 120 || self.direction === -1) show();
          else hide();
        },
      });
      header.addEventListener("focusin", show);
      return () => {
        trigger.kill();
        header.removeEventListener("focusin", show);
      };
    });
  });

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 border-b transition-colors duration-200",
          // Saat menu terbuka header berada di atas overlay gelap: transparan, logo putih.
          menuOpen ? "z-50 border-transparent bg-transparent" : "z-40 bg-surface",
          !menuOpen && (scrolled ? "border-line" : "border-transparent"),
        )}
      >
        <nav
          aria-label="Navigasi utama"
          className={cn(
            "container-page grid h-16 grid-cols-[1fr_auto] items-center text-[0.6875rem] font-medium uppercase tracking-[0.16em] transition-colors duration-200 md:grid-cols-5",
            menuOpen ? "text-surface" : "text-ink",
          )}
        >
          <Link href="/" className="justify-self-start" aria-label={`${brandName}, ke beranda`} onClick={() => setMenuOpen(false)}>
            {/* Brand sedikit lebih besar dari link lain; logo opsional ikut ukurannya. */}
            <BrandMark
              brandName={brandName}
              logo={logo}
              variant="caps"
              tone={menuOpen ? "light" : "dark"}
              className="text-sm transition-colors duration-200 md:text-[0.9375rem]"
            />
          </Link>

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("hidden justify-self-center transition-opacity duration-200 hover:opacity-60 md:block", menuOpen && "pointer-events-none opacity-0")}
            >
              {link.label}
            </Link>
          ))}
          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-expanded={searchOpen}
            aria-label="Cari undangan (tekan /)"
            title="Cari (/)"
            className={cn("hidden justify-self-center uppercase transition-opacity duration-200 hover:opacity-60 md:block", menuOpen && "pointer-events-none opacity-0")}
          >
            Cari
          </button>

          <div className="flex items-center justify-self-end gap-6">
            {consultUrl ? (
              <a
                href={consultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("hidden transition-opacity duration-200 hover:opacity-60 md:inline", menuOpen && "pointer-events-none opacity-0")}
              >
                WhatsApp
              </a>
            ) : null}
            <button
              ref={searchIconRef}
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-expanded={searchOpen}
              aria-label="Cari undangan (tekan /)"
              className={cn("grid size-9 place-items-center md:hidden", menuOpen && "pointer-events-none opacity-0")}
            >
              <MagnifyingGlassIcon size={18} />
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => {
                if (menuOpen) return closeMenu();
                setSearchOpen(false);
                setMenuOpen(true);
              }}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              className="relative -mr-2 grid size-9 place-items-center"
            >
              {/* Dua garis (yang bawah lebih pendek) menjadi silang saat menu terbuka. */}
              <span
                aria-hidden="true"
                className={cn("absolute right-2 h-px w-4 bg-current transition-transform duration-300 ease-expo", menuOpen ? "rotate-45" : "-translate-y-[3px]")}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "absolute right-2 h-px bg-current transition-[transform,width] duration-300 ease-expo",
                  menuOpen ? "w-4 -rotate-45" : "w-2.5 translate-y-[3px]",
                )}
              />
            </button>
          </div>
        </nav>
      </header>

      <MenuOverlay
        open={menuOpen}
        onClose={closeMenu}
        originRef={menuButtonRef}
        categories={categories}
        consultUrl={consultUrl}
        instagramUrl={instagramUrl}
      />
      <SearchOverlay open={searchOpen} onClose={closeSearch} index={searchIndex} />
    </>
  );
}
