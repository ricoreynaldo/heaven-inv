import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { TemplateTagPill } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/site/price";
import type { TemplateCardData } from "@/lib/data/public";
import { cn } from "@/lib/utils";

/**
 * Kartu katalog minimalis (thesis v3): tanpa bingkai. Gambar 4:5 di atas
 * latar canvas, tag sebagai label kotak di pojok kanan atas, lalu nama +
 * kategori dan harga. Seluruh kartu menuju detail (stretched link).
 *
 * Demo: di pointer presisi, strip "Lihat demo" meluncur naik di bawah gambar
 * saat kartu disorot (digerakkan motion/card-motion.tsx). Di layar sentuh
 * link demo selalu tampil sebagai teks kecil di samping harga.
 */
export function TemplateCard({
  template,
  priority = false,
  sizes = "(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw",
  headingLevel = "h3",
  interactive = true,
  className,
}: {
  template: TemplateCardData;
  priority?: boolean;
  sizes?: string;
  headingLevel?: "h2" | "h3";
  /** false untuk pratinjau (admin): tanpa link, tanpa prefetch. */
  interactive?: boolean;
  className?: string;
}) {
  const href = `/catalog/${template.slug}`;
  const Heading = headingLevel;
  const demoLabel = `Lihat demo ${template.name} (tab baru)`;

  return (
    <article data-card={interactive ? "" : undefined} className={cn("group relative flex flex-col", className)}>
      {/* data-card-image: sumber transisi kartu → detail; data-card-preview: dipudarkan GSAP saat hover. */}
      <div data-card-image="" className="relative aspect-[4/5] overflow-hidden bg-canvas">
        <SmartImage
          src={template.thumbnail}
          alt={`Pratinjau undangan ${template.name}`}
          fill
          sizes={sizes}
          preload={priority}
          loading={priority ? undefined : "lazy"}
          className="object-cover"
        />
        {interactive && template.previewImage ? (
          <span data-card-preview="" aria-hidden="true" className="invisible absolute inset-0 opacity-0">
            <SmartImage src={template.previewImage} alt="" fill sizes={sizes} loading="lazy" className="object-cover" />
          </span>
        ) : null}

        {template.tags.length > 0 ? (
          <span className="pointer-events-none absolute right-2.5 top-2.5 flex flex-col items-end gap-1 sm:right-3 sm:top-3">
            {template.tags.map((tag) => (
              <TemplateTagPill key={tag} tag={tag} />
            ))}
          </span>
        ) : null}

        {/* Strip demo untuk pointer presisi: tersembunyi di bawah tepi gambar sampai kartu disorot. */}
        {template.demoUrl ? (
          <a
            href={interactive ? template.demoUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            data-card-demo=""
            aria-label={demoLabel}
            className="absolute inset-x-0 bottom-0 z-10 hidden items-center justify-between bg-ink px-3.5 py-2.5 text-xs font-medium text-surface focus-visible:outline-offset-[-3px] focus-visible:outline-surface [@media(hover:hover)_and_(pointer:fine)]:flex"
          >
            Lihat demo
            <ArrowUpRightIcon size={13} aria-hidden="true" />
          </a>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col pt-3.5 sm:pt-4">
        <Heading className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm leading-snug">
          {interactive ? (
            <Link
              href={href}
              data-card-link={template.slug}
              className="font-display font-semibold tracking-[-0.01em] text-ink after:absolute after:inset-0 after:content-['']"
            >
              {template.name}
            </Link>
          ) : (
            <span className="font-display font-semibold tracking-[-0.01em] text-ink">{template.name}</span>
          )}
          <span className="text-xs font-normal text-ink-muted">{template.category.name}</span>
        </Heading>

        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Price price={template.price} originalPrice={template.originalPrice} className="text-[0.8125rem]" />
          {/* Layar sentuh: tidak ada hover, jadi link demo selalu terlihat. */}
          {template.demoUrl ? (
            <a
              href={interactive ? template.demoUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={demoLabel}
              className="relative z-10 inline-flex items-center gap-0.5 text-xs text-ink-soft underline decoration-accent underline-offset-4 [@media(hover:hover)_and_(pointer:fine)]:hidden"
            >
              Demo
              <ArrowUpRightIcon size={11} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
