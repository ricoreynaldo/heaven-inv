import { HeroMotion } from "@/components/motion/hero-motion";
import { HeroGallery } from "@/components/site/hero-gallery";
import { TextLink } from "@/components/site/text-link";
import type { SiteContent } from "@/lib/content/schema";

/** Koma pertama tetap menjadi pemisah baris untuk headline dari CMS. */
function splitHeadline(text: string): string[] {
  const comma = text.indexOf(", ");
  return comma > 0 ? [text.slice(0, comma + 1), text.slice(comma + 2)] : [text];
}

/** Hero galeri: judul di tengah, thumbnail katalog mengelilinginya di atas kanvas putih. */
export function Hero({
  hero,
  showcase,
  consultUrl,
}: {
  hero: SiteContent["hero"];
  showcase: { name: string; thumbnail: string }[];
  consultUrl: string | null;
}) {
  const lines = splitHeadline(hero.headline);
  const images = showcase.length ? showcase : hero.image ? [{ name: "", thumbnail: hero.image }] : [];

  return (
    <section aria-labelledby="hero-title" className="hero-gallery-section bg-surface pt-16">
      <div className="hero-stage">
        <HeroGallery images={images} />
        <HeroMotion className="hero-copy">
          <h1
            id="hero-title"
            data-hero-title=""
            className={`hero-headline${hero.headline.length > 18 ? " hero-headline-long" : ""}`}
          >
            {lines.map((line, index) => <span key={index} className="block">{line}</span>)}
          </h1>
          {hero.eyebrow ? (
            <p data-hero-sub="" className="meta-caps mt-5 text-ink-soft md:mt-6">{hero.eyebrow}</p>
          ) : null}
          {hero.subtitle ? (
            <p data-hero-item="" className="hero-description mt-5 text-ink-soft">{hero.subtitle}</p>
          ) : null}
          <div data-hero-item="" className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:mt-9 md:gap-x-10">
            <TextLink href="/catalog">{hero.primaryCta}</TextLink>
            {consultUrl ? <TextLink href={consultUrl} external>{hero.secondaryCta}</TextLink> : null}
          </div>
        </HeroMotion>
      </div>
    </section>
  );
}
