import Link from "next/link";
import { BrandMark } from "@/components/site/brand-mark";
import { getActiveCategories, getContent, getSettings } from "@/lib/data/public";
import { instagramUrl } from "@/lib/settings/schema";
import { buildWhatsAppUrl, formatPhoneNumber } from "@/lib/whatsapp";

const MENU = [
  { href: "/catalog", label: "Semua undangan" },
  { href: "/catalog?tag=best-seller", label: "Best Seller" },
  { href: "/catalog?tag=new", label: "Rilis terbaru" },
  { href: "/#cara-pesan", label: "Cara memesan" },
  { href: "/#faq", label: "Pertanyaan umum" },
];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="meta-caps font-semibold text-ink">{children}</h2>;
}

const linkClass = "meta-caps text-ink-muted transition-colors duration-200 hover:text-ink";

/**
 * Footer lookbook (thesis v5): semuanya teks kecil kapital berspasi lebar,
 * nama brand di kiri, kolom tautan, lalu baris tipis berisi hak cipta.
 */
export async function SiteFooter() {
  const [settings, content, categories] = await Promise.all([getSettings(), getContent(), getActiveCategories()]);
  const footer = content.footer;
  // Kontak footer bisa diisi khusus di Konten; kosong = ikut Pengaturan.
  const whatsapp = footer.whatsapp || settings.whatsappNumber;
  const instagram = footer.instagram || settings.instagram;
  const email = footer.email || settings.email;
  const waUrl = buildWhatsAppUrl(whatsapp, settings.whatsappConsultMessage);
  const igUrl = instagramUrl(instagram);

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-12 py-16 md:py-20 lg:grid-cols-12">
        <div className="col-span-2 lg:col-span-4">
          <Link href="/" aria-label={`${settings.brandName}, ke beranda`}>
            <BrandMark brandName={settings.brandName} logo={settings.logo} variant="caps" className="text-[0.9375rem]" />
          </Link>
          {footer.description ? <p className="meta-caps mt-5 max-w-[19rem] text-ink-muted">{footer.description}</p> : null}
        </div>

        <nav aria-label="Katalog" className="lg:col-span-2 lg:col-start-5">
          <FooterHeading>Katalog</FooterHeading>
          <ul className="mt-4 space-y-1">
            {MENU.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {categories.length > 0 ? (
          <nav aria-label="Kategori" className="lg:col-span-2">
            <FooterHeading>Kategori</FooterHeading>
            <ul className="mt-4 space-y-1">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/catalog?category=${category.slug}`} className={linkClass}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="lg:col-span-2">
          <FooterHeading>Kontak</FooterHeading>
          <ul className="mt-4 space-y-1">
            {waUrl ? (
              <li>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className={`${linkClass} tabular`}>
                  <span className="sr-only">WhatsApp: </span>
                  {formatPhoneNumber(whatsapp)}
                </a>
              </li>
            ) : null}
            {email ? (
              <li>
                <a href={`mailto:${email}`} className="break-all text-xs text-ink-muted transition-colors duration-200 hover:text-ink">
                  <span className="sr-only">Email: </span>
                  {email}
                </a>
              </li>
            ) : null}
            {settings.address ? <li className="meta-caps text-ink-muted">{settings.address}</li> : null}
          </ul>
        </div>

        {igUrl || waUrl ? (
          <div className="lg:col-span-2">
            <FooterHeading>Sosial</FooterHeading>
            <ul className="mt-4 space-y-1">
              {igUrl ? (
                <li>
                  <a href={igUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    Instagram
                  </a>
                </li>
              ) : null}
              {waUrl ? (
                <li>
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    WhatsApp
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-1 pb-28 pt-5 text-ink-muted sm:flex-row sm:items-center sm:justify-between lg:pb-5">
          <p className="meta-caps">{footer.copyright}</p>
          <p className="meta-caps">Pemesanan diproses melalui WhatsApp</p>
        </div>
      </div>
    </footer>
  );
}
