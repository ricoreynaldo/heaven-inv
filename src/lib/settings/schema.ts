import { z } from "zod";
import { ORDER_PLACEHOLDERS, normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { optionalEmail, optionalImageUrl, requiredText, text } from "@/lib/validation/common";

/** Pengaturan situs. Disimpan di tabel site_settings sebagai key/value. */

const whatsappNumber = z
  .string()
  .trim()
  .max(24)
  .refine((value) => value === "" || normalizeWhatsAppNumber(value) !== null, "Nomor WhatsApp tidak valid. Contoh: 6281234567890.")
  .transform((value) => (value === "" ? "" : (normalizeWhatsAppNumber(value) ?? "")));

export const brandSettingsSchema = z.object({
  brandName: requiredText(60, "Nama brand"),
  logo: optionalImageUrl,
  favicon: optionalImageUrl,
});

export const whatsappSettingsSchema = z.object({
  whatsappNumber,
  whatsappMessage: requiredText(1500, "Template pesan").refine(
    (value) => value.includes("{{template_name}}"),
    "Template pesan harus memuat {{template_name}} agar admin tahu template yang dipesan.",
  ),
  whatsappConsultMessage: requiredText(600, "Pesan konsultasi"),
});

export const contactSettingsSchema = z.object({
  instagram: text(120, "Instagram"),
  email: optionalEmail,
  address: text(240, "Alamat"),
});

export const seoSettingsSchema = z.object({
  seoTitle: requiredText(70, "SEO title"),
  seoDescription: requiredText(170, "SEO description"),
  ogImage: optionalImageUrl,
});

export const SETTINGS_GROUPS = {
  brand: brandSettingsSchema,
  whatsapp: whatsappSettingsSchema,
  contact: contactSettingsSchema,
  seo: seoSettingsSchema,
} as const;

export type SettingsGroup = keyof typeof SETTINGS_GROUPS;

export type SiteSettings = z.infer<typeof brandSettingsSchema> &
  z.infer<typeof whatsappSettingsSchema> &
  z.infer<typeof contactSettingsSchema> &
  z.infer<typeof seoSettingsSchema>;

export const DEFAULT_WHATSAPP_MESSAGE = `Halo Heaven Inv, saya tertarik dengan undangan digital berikut:

Template: {{template_name}}
Kategori: {{category}}
Harga: {{price}}
Demo: {{demo_url}}

Saya ingin memesan template tersebut.
Mohon informasi mengenai proses selanjutnya.
Terima kasih.`;

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "Heaven Inv",
  logo: "",
  favicon: "/brand/favicon.png",
  whatsappNumber: "",
  whatsappMessage: DEFAULT_WHATSAPP_MESSAGE,
  whatsappConsultMessage: "Halo Heaven Inv, saya ingin konsultasi mengenai undangan digital.",
  instagram: "",
  email: "",
  address: "",
  seoTitle: "Heaven Inv | Katalog Undangan Digital Premium",
  seoDescription:
    "Katalog undangan digital premium untuk pernikahan, lamaran, ulang tahun, dan acara perusahaan. Lihat demo, pilih template, pesan via WhatsApp.",
  ogImage: "/brand/og-default.jpg",
};

export const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[];

export { ORDER_PLACEHOLDERS };

export function mergeSettings(rows: { key: string; value: string }[]): SiteSettings {
  const result: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if ((SETTINGS_KEYS as string[]).includes(row.key)) {
      (result as Record<string, string>)[row.key] = row.value;
    }
  }
  if (!result.whatsappMessage.trim()) result.whatsappMessage = DEFAULT_WHATSAPP_MESSAGE;
  if (!result.brandName.trim()) result.brandName = DEFAULT_SETTINGS.brandName;
  return result;
}

/** "@heaveninv" | "heaveninv" | URL → URL profil Instagram, atau null. */
export function instagramUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "").replace(/[^A-Za-z0-9._]/g, "");
  return handle ? `https://instagram.com/${handle}` : null;
}

export function instagramHandle(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) {
    try {
      const segment = new URL(v).pathname.split("/").filter(Boolean)[0];
      return segment ? `@${segment}` : v;
    } catch {
      return v;
    }
  }
  return `@${v.replace(/^@/, "")}`;
}
