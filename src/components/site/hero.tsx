import Link from "next/link";
import { HeroMotion } from "@/components/motion/hero-motion";
import { SmartImage } from "@/components/ui/smart-image";
import { TextLink } from "@/components/site/text-link";
import type { SiteContent } from "@/lib/content/schema";

/** "Your Story, Beautifully Invited." → ["Your Story,", "Beautifully Invited."]. Tanpa koma: satu baris. */
function splitHeadline(text: string): string[] {
  const comma = text.indexOf(", ");
  return comma > 0 ? [text.slice(0, comma + 1), text.slice(comma + 2)] : [text];
}

/**
 * Hero lookbook (thesis v5): layar penuh yang hampir kosong. Judul kapital
 * berspasi lebar di tengah, label abu-abu di bawahnya, dua link teks. Pojok
 * kiri bawah: kalimat pembuka kecil. Pojok kanan bawah: sorotan undangan yang
 * bergiliran (motion/hero-motion.tsx).
 */
export function Hero({
  hero,
  showcase,
  consultUrl,
}: {
  hero: SiteContent["hero"];
  /** Undangan untuk sorotan pojok (best seller lebih dulu). Kosong = gambar cadangan hero. */
  showcase: { name: string; thumbnail: string }[];
  consultUrl: string | null;
}) {
  const lines = splitHeadline(hero.headline);
  const slides = showcase.length ? showcase.slice(0, 5) : [{ name: "", thumbnail: hero.image }];

  return (
    <section aria-labelledby="hero-title" className="flex min-h-svh flex-col pt-16">
      <HeroMotion className="container-page flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <h1
            id="hero-title"
            data-hero-title=""
            className="title-caps text-[1.625rem] leading-[1.35] text-ink sm:text-[2rem] md:text-[2.5rem] lg:text-[2.875rem]"
          >
            {lines.map((line, index) => (
              <span key={index} className="block md:whitespace-nowrap">
                {line}
              </span>
            ))}
          </h1>
          {hero.eyebrow ? (
            <p data-hero-sub="" className="meta-caps mt-6 text-ink-muted md:mt-8">
              {hero.eyebrow}
            </p>
          ) : null}
          <div data-hero-item="" className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:mt-14">
            <TextLink href="/catalog">{hero.primaryCta}</TextLink>
            {consultUrl ? (
              <TextLink href={consultUrl} external>
                {hero.secondaryCta}
              </TextLink>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-end gap-8 pb-8 md:pb-10">
          {hero.subtitle ? (
            <p data-hero-item="" className="meta-caps max-w-[21rem] text-ink-muted">
              {hero.subtitle}
            </p>
          ) : (
            <span />
          )}
          <Link
            href="/catalog"
            data-hero-item=""
            data-hero-corner=""
            aria-label="Lihat koleksi undangan"
            className="group hidden items-end gap-4 sm:flex"
          >
            {slides[0]?.name ? (
              <span aria-hidden="true" className="relative block h-[3.6rem] w-36 text-right">
                <span className="meta-caps block text-ink-muted">Sorotan</span>
                {slides.map((slide, index) => (
                  <span
                    key={slide.thumbnail}
                    data-hero-caption=""
                    className="meta-caps absolute inset-x-0 bottom-0 block truncate text-ink"
                    style={index === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
                  >
                    {slide.name}
                  </span>
                ))}
              </span>
            ) : null}
            <span aria-hidden="true" className="relative block aspect-[4/5] w-16 overflow-hidden bg-canvas md:w-[4.5rem]">
              {slides.map((slide, index) => (
                <span
                  key={slide.thumbnail}
                  data-hero-slide=""
                  className="absolute inset-0"
                  style={index === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
                >
                  <SmartImage
                    src={slide.thumbnail}
                    alt=""
                    fill
                    preload={index === 0}
                    sizes="80px"
                    className="object-cover transition-transform duration-400 ease-expo group-hover:scale-[1.06]"
                  />
                </span>
              ))}
            </span>
          </Link>
        </div>
      </HeroMotion>
    </section>
  );
}
