import { Hero } from "@/components/site/hero";
import {
  AboutSection,
  CategoriesSection,
  CTASection,
  FaqSection,
  HowItWorksSection,
  TemplateShelf,
} from "@/components/site/home-sections";
import { FloatingWhatsApp } from "@/components/site/whatsapp-button";
import { getActiveCategories, getContent, getFeaturedTemplates, getSettings, getTaggedTemplates } from "@/lib/data/public";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export default async function HomePage() {
  const [content, settings, featured, bestSellers, categories] = await Promise.all([
    getContent(),
    getSettings(),
    getFeaturedTemplates(8),
    getTaggedTemplates("best-seller", 4),
    getActiveCategories(),
  ]);
  const consultUrl = buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappConsultMessage);
  // Sorotan pojok hero: best seller lebih dulu, lalu koleksi pilihan.
  const bestSellerIds = new Set(bestSellers.map((template) => template.id));
  const showcase = [...bestSellers, ...featured.filter((template) => !bestSellerIds.has(template.id))];

  return (
    <>
      <Hero
        hero={content.hero}
        showcase={showcase.map((template) => ({ name: template.name, thumbnail: template.thumbnail }))}
        consultUrl={consultUrl}
      />
      <TemplateShelf
        id="best-seller"
        title="Best Seller"
        subtitle="Undangan yang paling banyak dipilih pelanggan kami."
        href="/catalog?tag=best-seller"
        linkLabel="Semua best seller"
        templates={bestSellers}
      />
      <CategoriesSection heading={content.categories} categories={categories} />
      <TemplateShelf
        id="featured"
        title={content.featured.title}
        subtitle={content.featured.subtitle}
        href="/catalog"
        linkLabel="Lihat semua katalog"
        templates={featured}
      />
      <AboutSection about={content.about} whyUs={content.whyUs} />
      <HowItWorksSection howItWorks={content.howItWorks} />
      <FaqSection faq={content.faq} consultUrl={consultUrl} />
      <CTASection cta={content.cta} consultUrl={consultUrl} />
      <FloatingWhatsApp href={consultUrl} />
    </>
  );
}
