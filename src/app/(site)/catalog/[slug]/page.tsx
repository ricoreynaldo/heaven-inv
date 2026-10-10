import { ArrowUpRightIcon, CheckIcon, ChatCircleDotsIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TemplateTagPill } from "@/components/ui/badge";
import { ButtonArrow, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion/reveal";
import { TemplateShelf } from "@/components/site/home-sections";
import { TemplateGallery } from "@/components/site/template-gallery";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getPublishedSlugs, getRelatedTemplates, getSettings, getTemplateBySlug } from "@/lib/data/public";
import { formatRupiah } from "@/lib/format";
import { discountPercent } from "@/lib/pricing";
import { Price } from "@/components/site/price";
import { absoluteUrl } from "@/lib/site-url";
import { buildOrderUrl, buildWhatsAppUrl } from "@/lib/whatsapp";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  // Cache Components butuh minimal satu param; slug placeholder akan berujung 404.
  return slugs.length > 0 ? slugs.map(({ slug }) => ({ slug })) : [{ slug: "__placeholder__" }];
}

function summarize(text: string, max = 158) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export async function generateMetadata({ params }: PageProps<"/catalog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) return { title: "Undangan tidak ditemukan", robots: { index: false } };
  const description =
    summarize(template.description) ||
    `Undangan digital ${template.name} untuk kategori ${template.category.name}. Lihat demo dan pesan via WhatsApp.`;
  const title = `${template.name}, Undangan ${template.category.name}`;
  return {
    title,
    description,
    alternates: { canonical: `/catalog/${template.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/catalog/${template.slug}`,
      images: [{ url: template.thumbnail, width: 1200, height: 1500, alt: `Pratinjau undangan ${template.name}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [template.thumbnail] },
  };
}

async function TemplateDetail({ params }: { params: PageProps<"/catalog/[slug]">["params"] }) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) notFound();

  const [settings, related] = await Promise.all([getSettings(), getRelatedTemplates(template.categoryId, template.id, 4)]);
  const price = formatRupiah(template.price);
  const demoUrl = template.demoUrl ? absoluteUrl(template.demoUrl) : "";
  const orderUrl = buildOrderUrl(settings.whatsappNumber, settings.whatsappMessage, {
    templateName: template.name,
    category: template.category.name,
    price,
    demoUrl,
  });
  const consultUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    `Halo ${settings.brandName}, saya ingin bertanya tentang template ${template.name}.`,
  );
  const images = [template.thumbnail, ...template.images.map((image) => image.url)];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: template.name,
    description: template.description || undefined,
    image: images.map((src) => absoluteUrl(src)),
    category: template.category.name,
    brand: { "@type": "Brand", name: settings.brandName },
    url: absoluteUrl(`/catalog/${template.slug}`),
    offers: {
      "@type": "Offer",
      price: template.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/catalog/${template.slug}`),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="container-page pb-32 pt-24 md:pt-28 lg:pb-24">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-ink-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li className="flex items-center gap-2">
              <Link href="/catalog" className="hover:text-ink">
                Katalog
              </Link>
              <span aria-hidden="true" className="h-px w-4 bg-line-strong" />
            </li>
            <li className="flex items-center gap-2">
              <Link href={`/catalog?category=${template.category.slug}`} className="hover:text-ink">
                {template.category.name}
              </Link>
              <span aria-hidden="true" className="h-px w-4 bg-line-strong" />
            </li>
            <li aria-current="page" className="text-ink">
              {template.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="min-w-0 lg:col-span-7">
            <TemplateGallery images={images} name={template.name} slug={template.slug} />
          </div>

          <div className="min-w-0 lg:col-span-5">
            <Reveal className="lg:sticky lg:top-24" onMount>
              <div data-reveal="" className="flex flex-wrap items-center gap-2">
                <Link href={`/catalog?category=${template.category.slug}`} className="meta-caps mr-1 text-ink-soft underline decoration-transparent underline-offset-4 hover:text-ink hover:decoration-accent">
                  {template.category.name}
                </Link>
                {template.tags.map((tag) => (
                  <TemplateTagPill key={tag} tag={tag} />
                ))}
              </div>
              <h1 data-reveal="" className="title-caps mt-5 text-2xl text-ink md:text-[2rem]">
                {template.name}
              </h1>
              <div data-reveal="" className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <Price
                  price={template.price}
                  originalPrice={template.originalPrice}
                  className="gap-x-2.5"
                  priceClassName="text-2xl font-medium text-ink"
                  originalClassName="text-lg text-ink-muted"
                />
                {template.originalPrice ? (
                  <span className="rounded-control bg-accent-soft px-2.5 py-1 text-xs font-medium text-ink">
                    Hemat {formatRupiah(template.originalPrice - template.price)} ({discountPercent(template.price, template.originalPrice)}%)
                  </span>
                ) : null}
              </div>
              {template.description ? (
                <div data-reveal="" className="mt-6 space-y-4 text-ink-soft">
                  {template.description.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              <div data-reveal="" className="mt-8 flex flex-col gap-3 sm:flex-row">
                <WhatsAppButton href={orderUrl} className="sm:flex-1" magnetic>
                  Pesan via WhatsApp
                </WhatsAppButton>
                {template.demoUrl ? (
                  <ButtonLink
                    href={template.demoUrl}
                    external
                    variant="outline"
                    size="lg"
                    className="sm:flex-1"
                    data-magnetic=""
                    aria-label={`Lihat demo ${template.name} (tab baru)`}
                  >
                    Lihat Demo
                    <ButtonArrow>
                      <ArrowUpRightIcon size={16} />
                    </ButtonArrow>
                  </ButtonLink>
                ) : null}
              </div>
              <p data-reveal="" className="mt-3 text-xs text-ink-muted">
                Tombol pesan membuka WhatsApp admin dengan detail undangan ini sudah tertulis.
              </p>

              {template.features.length > 0 ? (
                <div data-reveal="" className="mt-10">
                  <h2 className="label-caps text-ink-muted">Yang kamu dapatkan</h2>
                  <ul className="mt-3 border-t border-line">
                    {template.features.map((feature, index) => (
                      <li key={`${feature}-${index}`} className="flex gap-3 border-b border-line py-3 text-sm text-ink-soft">
                        <CheckIcon size={16} className="mt-0.5 shrink-0 text-ink" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {consultUrl ? (
                <a
                  href={consultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-reveal=""
                  className="group mt-8 flex items-center gap-4 rounded-card bg-surface p-4 ring-1 ring-line transition-shadow duration-200 hover:ring-accent"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-control bg-accent-soft text-ink">
                    <ChatCircleDotsIcon size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">Ada pertanyaan tentang {template.name}?</span>
                    <span className="block text-sm text-ink-soft">Tanyakan warna, fitur, atau penyesuaian.</span>
                  </span>
                  <ArrowUpRightIcon
                    size={16}
                    className="shrink-0 text-ink-muted transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </a>
              ) : null}
            </Reveal>
          </div>
        </div>
      </div>

      <TemplateShelf
        id="related"
        title="Undangan serupa"
        href={`/catalog?category=${template.category.slug}`}
        linkLabel={`Semua ${template.category.name}`}
        templates={related}
      />

      {/* CTA lengket di ponsel supaya tombol pesan selalu terlihat. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 pt-3 lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-ink-muted">{template.name}</p>
            <p>
              <Price price={template.price} originalPrice={template.originalPrice} originalClassName="text-xs text-ink-muted" />
            </p>
          </div>
          {template.demoUrl ? (
            <ButtonLink href={template.demoUrl} external variant="outline" size="md" aria-label={`Lihat demo ${template.name} (tab baru)`}>
              Demo
            </ButtonLink>
          ) : null}
          <WhatsAppButton href={orderUrl} size="md">
            Pesan
          </WhatsAppButton>
        </div>
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="container-page pb-24 pt-24 md:pt-28" role="status" aria-label="Memuat undangan">
      <Skeleton className="mb-8 h-4 w-56" />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <Skeleton className="aspect-[4/5] rounded-card lg:col-span-7" />
        <div className="space-y-5 lg:col-span-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-14 w-3/4" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-control" />
            <Skeleton className="h-12 flex-1 rounded-control" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplatePage(props: PageProps<"/catalog/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <TemplateDetail params={props.params} />
    </Suspense>
  );
}
