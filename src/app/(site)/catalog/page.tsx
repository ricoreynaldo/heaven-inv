import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/site/catalog-browser";
import { CatalogFiltersSkeleton, CatalogGridSkeleton, CatalogResults } from "@/components/site/catalog-results";
import { FloatingWhatsApp } from "@/components/site/whatsapp-button";
import { getActiveCategories, getSettings } from "@/lib/data/public";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Katalog Undangan Digital",
  description:
    "Jelajahi koleksi undangan digital premium: pernikahan, lamaran, ulang tahun, islami, dan acara perusahaan. Lihat demo dan pesan langsung via WhatsApp.",
  alternates: { canonical: "/catalog" },
};

async function Browser({ searchParams }: { searchParams: PageProps<"/catalog">["searchParams"] }) {
  const categories = await getActiveCategories();
  return (
    <CatalogBrowser categories={categories.map(({ slug, name, templateCount }) => ({ slug, name, templateCount }))}>
      <Suspense fallback={<CatalogGridSkeleton />}>
        <CatalogResults searchParams={searchParams} />
      </Suspense>
    </CatalogBrowser>
  );
}

async function ConsultButton() {
  const settings = await getSettings();
  return <FloatingWhatsApp href={buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappConsultMessage)} />;
}

export default function CatalogPage(props: PageProps<"/catalog">) {
  return (
    <>
      <section aria-label="Daftar undangan" className="container-page pb-24 pt-24 md:pb-32 md:pt-28">
        <Suspense
          fallback={
            <>
              <CatalogFiltersSkeleton />
              <div className="mt-12">
                <CatalogGridSkeleton />
              </div>
            </>
          }
        >
          <Browser searchParams={props.searchParams} />
        </Suspense>
      </section>
      <ConsultButton />
    </>
  );
}
