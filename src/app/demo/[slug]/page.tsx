import { ArrowDownIcon, ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { Reveal } from "@/components/motion/reveal";
import { Price } from "@/components/site/price";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getPublishedSlugs, getSettings, getTemplateBySlug } from "@/lib/data/public";
import { formatRupiah } from "@/lib/format";
import { absoluteUrl } from "@/lib/site-url";
import { buildOrderUrl } from "@/lib/whatsapp";

/**
 * Demo bawaan untuk undangan yang belum punya demo eksternal: menampilkan
 * seluruh tampilan undangan seperti yang digulir tamu di ponsel (gaya v3:
 * kolom tajam tanpa bayangan, tiap bagian muncul berurutan saat di-scroll).
 */

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.length > 0 ? slugs.map(({ slug }) => ({ slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/demo/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  return {
    title: template ? `Demo ${template.name}` : "Demo tidak ditemukan",
    robots: { index: false, follow: true },
  };
}

async function Demo({ params }: { params: PageProps<"/demo/[slug]">["params"] }) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) notFound();
  const settings = await getSettings();
  const price = formatRupiah(template.price);
  const orderUrl = buildOrderUrl(settings.whatsappNumber, settings.whatsappMessage, {
    templateName: template.name,
    category: template.category.name,
    price,
    demoUrl: absoluteUrl(`/demo/${template.slug}`),
  });
  const sections = template.images.map((image) => image.url);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-surface">
        <div className="container-page grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Link
            href={`/catalog/${template.slug}`}
            className="group inline-flex items-center gap-2 text-xs text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowLeftIcon size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
            <span className="hidden sm:inline">Detail undangan</span>
          </Link>
          <p className="min-w-0 truncate text-center text-xs text-ink-muted">
            Demo <span className="font-display text-sm font-semibold tracking-[-0.01em] text-ink">{template.name}</span>
          </p>
          <div className="flex justify-end">
            <WhatsAppButton href={orderUrl} size="sm" showIcon={false}>
              Pesan
            </WhatsAppButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[28rem] px-4 pb-16 pt-20 sm:px-0">
        <Reveal onMount className="bg-surface ring-1 ring-line">
          <section aria-label="Cover undangan" data-reveal="" className="relative aspect-[4/5]">
            <SmartImage src={template.thumbnail} alt={`Cover undangan ${template.name}`} fill preload sizes="28rem" className="object-cover" />
            <div className="absolute inset-x-0 bottom-6 flex justify-center">
              <a
                href="#isi-undangan"
                className="inline-flex h-10 items-center gap-2 bg-ink px-5 text-xs font-medium text-surface transition-colors duration-200 hover:bg-ink/88"
              >
                Buka Undangan
                <ArrowDownIcon size={14} aria-hidden="true" />
              </a>
            </div>
          </section>
        </Reveal>

        <Reveal className="bg-surface ring-1 ring-line">
          <div id="isi-undangan" className="scroll-mt-16">
            {sections.map((src, index) => (
              <section key={`${src}-${index}`} data-reveal="" aria-label={`Bagian ${index + 2}`} className="relative aspect-[4/5]">
                <SmartImage src={src} alt={`Tampilan ${template.name}, bagian ${index + 2}`} fill sizes="28rem" className="object-cover" />
              </section>
            ))}
          </div>

          <section data-reveal="" className="border-t border-line px-6 py-12 text-center">
            <p className="label-caps text-accent-deep">{template.category.name}</p>
            <h1 className="title-caps mt-4 text-lg text-ink">Suka dengan {template.name}?</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Pesan sekarang seharga{" "}
              <Price price={template.price} originalPrice={template.originalPrice} originalClassName="text-xs text-ink-muted" />. Data acaramu kami
              susun ke dalam desain ini.
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <WhatsAppButton href={orderUrl}>Pesan Sekarang</WhatsAppButton>
              <ButtonLink href="/catalog" variant="outline" size="lg">
                Lihat undangan lain
              </ButtonLink>
            </div>
          </section>
        </Reveal>
        <p className="mt-6 text-center text-xs text-ink-muted">Contoh tampilan dengan data fiktif. Isi undangan disesuaikan dengan acaramu.</p>
      </main>
    </div>
  );
}

export default function DemoPage(props: PageProps<"/demo/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" aria-busy="true" />}>
      <Demo params={props.params} />
    </Suspense>
  );
}
