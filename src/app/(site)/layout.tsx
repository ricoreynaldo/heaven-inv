import { Suspense } from "react";
import { CardMotion } from "@/components/motion/card-motion";
import { MagneticMotion } from "@/components/motion/magnetic";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { Navbar } from "@/components/site/navbar";
import { SiteFooter } from "@/components/site/site-footer";
import { getActiveCategories, getSearchIndex, getSettings } from "@/lib/data/public";
import { instagramUrl } from "@/lib/settings/schema";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

async function SiteHeader() {
  const [settings, categories, searchIndex] = await Promise.all([getSettings(), getActiveCategories(), getSearchIndex()]);
  return (
    <Navbar
      brandName={settings.brandName}
      logo={settings.logo}
      consultUrl={buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappConsultMessage)}
      instagramUrl={instagramUrl(settings.instagram)}
      categories={categories.map(({ slug, name }) => ({ slug, name }))}
      searchIndex={searchIndex}
    />
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#konten"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-control bg-ink px-5 py-3 text-sm text-canvas transition-transform focus:translate-y-0"
      >
        Lewati ke konten
      </a>
      <SiteHeader />
      <main id="konten" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
      <CardMotion />
      <MagneticMotion />
      {/* usePathname() = data URL: di rute dinamis wajib di dalam <Suspense> agar halaman tetap bisa diprerender. */}
      <Suspense fallback={null}>
        <ScrollProgress />
      </Suspense>
    </>
  );
}
