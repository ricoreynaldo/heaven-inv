import { Reveal } from "@/components/motion/reveal";
import { SplitTitle } from "@/components/motion/split-title";
import { ContentIcon } from "@/components/ui/content-icon";
import { CategoryIndex } from "@/components/site/category-index";
import { FaqList } from "@/components/site/faq-list";
import { SectionHeading } from "@/components/site/section-heading";
import { TemplateCard } from "@/components/site/template-card";
import { TextLink } from "@/components/site/text-link";
import type { SiteContent } from "@/lib/content/schema";
import type { CategoryCardData, TemplateCardData } from "@/lib/data/public";
import { cn } from "@/lib/utils";

/*
 * Section beranda thesis v5 (lookbook): setiap section dibuka judul kapital
 * berspasi lebar di tengah + keterangan abu-abu, isi di bawahnya, lalu satu
 * link teks di tengah. Dipisah garis tipis, jarak vertikal lapang.
 */
const SECTION = "border-t border-line py-24 md:py-36";

/* -------------------------------------------------------------------------- */
/* Grid kartu undangan (Best Seller, Koleksi Pilihan, Undangan serupa)         */
/* -------------------------------------------------------------------------- */

export function TemplateShelf({
  id,
  title,
  subtitle,
  href,
  linkLabel,
  templates,
}: {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  linkLabel: string;
  templates: TemplateCardData[];
}) {
  if (templates.length === 0) return null;
  return (
    <section aria-labelledby={`${id}-title`} className={SECTION}>
      <div className="container-page">
        <SectionHeading id={`${id}-title`} title={title} subtitle={subtitle} />
        <Reveal
          as="ul"
          className={cn(
            "mx-auto mt-14 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:mt-20 lg:gap-x-10",
            templates.length >= 4 ? "lg:grid-cols-4" : "max-w-5xl lg:grid-cols-3",
          )}
        >
          {templates.map((template) => (
            <li key={template.id} data-reveal="" className="flex">
              <TemplateCard template={template} className="w-full" />
            </li>
          ))}
        </Reveal>
        <div className="mt-14 flex justify-center md:mt-20">
          <TextLink href={href}>{linkLabel}</TextLink>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Kategori                                                                    */
/* -------------------------------------------------------------------------- */

export function CategoriesSection({
  heading,
  categories,
}: {
  heading: SiteContent["categories"];
  categories: CategoryCardData[];
}) {
  if (categories.length === 0) return null;
  return (
    <section id="kategori" aria-labelledby="categories-title" className={cn(SECTION, "scroll-mt-16")}>
      <div className="container-page">
        <SectionHeading id="categories-title" title={heading.title} subtitle={heading.subtitle} />
        <Reveal className="mt-14 md:mt-20">
          <CategoryIndex categories={categories} />
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Tentang + keunggulan                                                        */
/* -------------------------------------------------------------------------- */

export function AboutSection({ about, whyUs }: { about: SiteContent["about"]; whyUs: SiteContent["whyUs"] }) {
  const paragraphs = about.description.split(/\n{2,}/).filter(Boolean);
  const columns = whyUs.items.length >= 5 ? "lg:grid-cols-5" : whyUs.items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <section aria-labelledby="about-title" className={SECTION}>
      <div className="container-page">
        <SectionHeading id="about-title" title={about.title} />
        <Reveal className="mx-auto mt-10 max-w-xl space-y-4 text-center text-sm leading-relaxed text-ink-soft md:text-[0.9375rem]">
          {paragraphs.map((paragraph, index) => (
            <p key={index} data-reveal="">
              {paragraph}
            </p>
          ))}
        </Reveal>

        <div className="mt-24 md:mt-32">
          <SectionHeading title={whyUs.title} subtitle={whyUs.subtitle} />
          <Reveal as="ul" className={cn("mt-14 grid gap-x-10 gap-y-12 text-center sm:grid-cols-2 md:mt-16", columns)}>
            {whyUs.items.map((item, index) => (
              <li key={`${item.title}-${index}`} data-reveal="" className="flex flex-col items-center">
                <ContentIcon name={item.icon} size={20} className="text-ink-soft" />
                <p className="meta-caps mt-5 font-semibold text-ink">{item.title}</p>
                <p className="mt-2 max-w-[15rem] text-sm text-ink-soft">{item.description}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Cara memesan                                                                */
/* -------------------------------------------------------------------------- */

export function HowItWorksSection({ howItWorks }: { howItWorks: SiteContent["howItWorks"] }) {
  const steps = howItWorks.steps;
  return (
    <section id="cara-pesan" aria-labelledby="how-title" className={cn(SECTION, "scroll-mt-16")}>
      <div className="container-page">
        <SectionHeading id="how-title" title={howItWorks.title} subtitle={howItWorks.subtitle} />
        <Reveal
          as="ol"
          className={cn(
            "mt-14 grid gap-x-10 gap-y-14 text-center md:mt-20",
            steps.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : steps.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2",
          )}
        >
          {steps.map((step, index) => (
            <li key={`${step.number}-${index}`} data-reveal="" className="flex flex-col items-center">
              <span className="meta-caps tabular text-ink-muted">{step.number}</span>
              <h3 className="title-caps mt-5 text-[0.9375rem] text-ink">{step.title}</h3>
              <p className="mt-3 max-w-[16rem] text-sm text-ink-soft">{step.description}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */

export function FaqSection({ faq, consultUrl }: { faq: SiteContent["faq"]; consultUrl: string | null }) {
  if (faq.items.length === 0) return null;
  // Data terstruktur FAQPage untuk Google, dari isi yang sama dengan yang tampil.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return (
    <section id="faq" aria-labelledby="faq-title" className={cn(SECTION, "scroll-mt-16")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-page">
        <SectionHeading id="faq-title" title={faq.title} subtitle={faq.subtitle} />
        <div className="mx-auto mt-14 max-w-2xl md:mt-20">
          <FaqList items={faq.items} />
        </div>
        {consultUrl ? (
          <div className="mt-14 flex justify-center">
            <TextLink href={consultUrl} external>
              Tanya lewat WhatsApp
            </TextLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* CTA penutup                                                                 */
/* -------------------------------------------------------------------------- */

export function CTASection({ cta, consultUrl }: { cta: SiteContent["cta"]; consultUrl: string | null }) {
  const external = /^https?:\/\//i.test(cta.buttonLink);
  return (
    <section aria-labelledby="cta-title" className="border-t border-line">
      <div className="container-page flex min-h-[70svh] flex-col items-center justify-center py-28 text-center">
        <SplitTitle id="cta-title" className="title-caps max-w-3xl text-[1.375rem] text-ink md:text-[2rem]">
          {cta.title}
        </SplitTitle>
        <Reveal className="flex flex-col items-center">
          {cta.description ? (
            <p data-reveal="" className="meta-caps mt-6 max-w-md text-ink-muted">
              {cta.description}
            </p>
          ) : null}
          <div data-reveal="" className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            <TextLink href={cta.buttonLink} external={external}>
              {cta.buttonText}
            </TextLink>
            {consultUrl ? (
              <TextLink href={consultUrl} external>
                Chat WhatsApp
              </TextLink>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
