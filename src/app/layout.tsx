import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/toaster";
import { getSettings } from "@/lib/data/public";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

/* Display: Plus Jakarta Sans variable 200–800 (MASTER.md → Tipografi). */
const jakarta = localFont({
  src: [{ path: "./fonts/plus-jakarta-sans-latin-wght-normal.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/* UI & body: Geist variable (100–900). */
const geist = localFont({
  src: [{ path: "./fonts/geist-latin-wght-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-geist",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: settings.seoTitle, template: `%s | ${settings.brandName}` },
    description: settings.seoDescription,
    applicationName: settings.brandName,
    icons: {
      icon: settings.favicon || "/brand/favicon.png",
      apple: "/brand/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: settings.brandName,
      title: settings.seoTitle,
      description: settings.seoDescription,
      images: settings.ogImage ? [{ url: settings.ogImage, width: 1200, height: 630, alt: settings.brandName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seoTitle,
      description: settings.seoDescription,
      images: settings.ogImage ? [settings.ogImage] : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

/*
 * Tandai bahwa JS aktif sebelum paint pertama: elemen yang akan dianimasikan
 * GSAP disembunyikan oleh CSS hanya bila kelas ini ada (lihat globals.css).
 */
const motionFlag = "document.documentElement.classList.add('js-motion')";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={`${jakarta.variable} ${geist.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
