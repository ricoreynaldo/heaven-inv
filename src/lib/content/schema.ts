import { z } from "zod";
import { ICON_KEYS } from "@/lib/icon-keys";
import { imageUrl, linkHref, optionalEmail, requiredText, text } from "@/lib/validation/common";

/**
 * Konten homepage yang bisa diedit admin.
 * Disimpan di tabel site_content sebagai (section, key, value). Field array
 * (items/steps) disimpan sebagai JSON string di satu baris.
 */

const iconKey = z.enum(ICON_KEYS, { message: "Pilih ikon dari daftar." });

export const heroSchema = z.object({
  eyebrow: text(60, "Label kecil"),
  headline: requiredText(120, "Headline"),
  subtitle: text(240, "Subtitle"),
  primaryCta: requiredText(32, "Teks tombol utama"),
  secondaryCta: requiredText(40, "Teks tombol kedua"),
  image: imageUrl,
});

export const sectionHeadingSchema = z.object({
  title: requiredText(90, "Judul"),
  subtitle: text(200, "Subjudul"),
});

export const aboutSchema = z.object({
  title: requiredText(120, "Judul"),
  description: requiredText(900, "Deskripsi"),
});

export const featureItemSchema = z.object({
  icon: iconKey,
  title: requiredText(60, "Judul item"),
  description: requiredText(220, "Deskripsi item"),
});

export const whyUsSchema = z.object({
  title: requiredText(90, "Judul"),
  subtitle: text(200, "Subjudul"),
  items: z.array(featureItemSchema).min(1, "Minimal satu keunggulan.").max(8, "Maksimal 8 keunggulan."),
});

export const stepItemSchema = z.object({
  number: requiredText(4, "Nomor"),
  icon: iconKey,
  title: requiredText(60, "Judul langkah"),
  description: requiredText(220, "Deskripsi langkah"),
});

export const howItWorksSchema = z.object({
  title: requiredText(90, "Judul"),
  subtitle: text(200, "Subjudul"),
  steps: z.array(stepItemSchema).min(1, "Minimal satu langkah.").max(6, "Maksimal 6 langkah."),
});

export const faqItemSchema = z.object({
  question: requiredText(140, "Pertanyaan"),
  answer: requiredText(600, "Jawaban"),
});

export const faqSchema = z.object({
  title: requiredText(90, "Judul"),
  subtitle: text(200, "Subjudul"),
  items: z.array(faqItemSchema).min(1, "Minimal satu pertanyaan.").max(12, "Maksimal 12 pertanyaan."),
});

export const ctaSchema = z.object({
  title: requiredText(140, "Judul"),
  description: text(260, "Deskripsi"),
  buttonText: requiredText(32, "Teks tombol"),
  buttonLink: linkHref,
});

export const footerSchema = z.object({
  description: text(300, "Deskripsi"),
  instagram: text(120, "Instagram"),
  whatsapp: text(32, "WhatsApp"),
  email: optionalEmail,
  copyright: requiredText(160, "Copyright"),
});

export const CONTENT_SCHEMAS = {
  hero: heroSchema,
  featured: sectionHeadingSchema,
  categories: sectionHeadingSchema,
  about: aboutSchema,
  whyUs: whyUsSchema,
  howItWorks: howItWorksSchema,
  faq: faqSchema,
  cta: ctaSchema,
  footer: footerSchema,
} as const;

export type ContentSection = keyof typeof CONTENT_SCHEMAS;
export const CONTENT_SECTIONS = Object.keys(CONTENT_SCHEMAS) as ContentSection[];

export type SiteContent = { [K in ContentSection]: z.infer<(typeof CONTENT_SCHEMAS)[K]> };
export type FeatureItem = z.infer<typeof featureItemSchema>;
export type StepItem = z.infer<typeof stepItemSchema>;
export type FaqItem = z.infer<typeof faqItemSchema>;

/** Field yang disimpan sebagai JSON. */
export const JSON_FIELDS: Partial<Record<ContentSection, string[]>> = {
  whyUs: ["items"],
  howItWorks: ["steps"],
  faq: ["items"],
};

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Your Story, Beautifully Invited",
    headline: "Heaven Inv",
    subtitle: "Lagi cari undangan digital? Pilih desain yang kamu suka, intip demonya, terus pesan gampang via WhatsApp!",
    primaryCta: "Lihat Koleksi",
    secondaryCta: "Konsultasi via WhatsApp",
    image: "/seed/hero/hero.webp",
  },
  featured: {
    title: "Koleksi Pilihan",
    subtitle: "Desain yang paling sering dipilih pasangan kami musim ini.",
  },
  categories: {
    title: "Untuk Setiap Perayaan",
    subtitle: "Dari akad hingga ulang tahun, temukan gaya yang sesuai dengan acaramu.",
  },
  about: {
    title: "Dirancang dengan rasa, dibagikan dengan satu tautan.",
    description:
      "Heaven Inv lahir dari kecintaan pada detail kartu undangan cetak: tipografi yang tenang, ornamen yang tidak berlebihan, dan komposisi yang lapang. Kami membawa rasa itu ke layar ponsel, lengkap dengan peta lokasi, galeri foto, musik, dan konfirmasi kehadiran tamu.",
  },
  whyUs: {
    title: "Mengapa Heaven Inv",
    subtitle: "Hal-hal kecil yang membuat undanganmu terasa istimewa sejak dibuka.",
    items: [
      {
        icon: "sparkle",
        title: "Desain Premium",
        description: "Setiap template dirancang dari nol dengan tipografi dan ornamen yang serasi, bukan sekadar ganti warna.",
      },
      {
        icon: "device-mobile",
        title: "Responsif",
        description: "Tampil rapi di ponsel, tablet, dan laptop tamu tanpa perlu memperbesar layar.",
      },
      {
        icon: "share-network",
        title: "Mudah Dibagikan",
        description: "Satu tautan untuk semua tamu. Kirim lewat WhatsApp, Instagram, atau grup keluarga.",
      },
      {
        icon: "lightning",
        title: "Proses Cepat",
        description: "Begitu data acara lengkap, undangan segera kami susun dan siap dibagikan.",
      },
      {
        icon: "wallet",
        title: "Harga Terjangkau",
        description: "Harga jelas sejak awal, tanpa biaya cetak dan tanpa biaya tersembunyi.",
      },
    ],
  },
  howItWorks: {
    title: "Cara Memesan",
    subtitle: "Empat langkah sederhana, semuanya bisa dari ponsel.",
    steps: [
      {
        number: "01",
        icon: "cursor-click",
        title: "Pilih Template",
        description: "Jelajahi koleksi dan temukan desain yang paling cocok dengan acaramu.",
      },
      {
        number: "02",
        icon: "eye",
        title: "Lihat Demo",
        description: "Buka demo untuk melihat undangan persis seperti yang akan diterima tamu.",
      },
      {
        number: "03",
        icon: "whatsapp-logo",
        title: "Pesan via WhatsApp",
        description: "Tekan Pesan Sekarang. Detail template pilihanmu sudah tertulis di pesan untuk admin.",
      },
      {
        number: "04",
        icon: "envelope-open",
        title: "Kami Proses Undanganmu",
        description: "Kirim data acara, kami susun undangannya lalu kirimkan tautan siap bagikan.",
      },
    ],
  },
  faq: {
    title: "Pertanyaan yang sering ditanyakan",
    subtitle: "Belum menemukan jawabannya? Tanyakan langsung lewat WhatsApp.",
    items: [
      {
        question: "Bagaimana cara memesan undangan?",
        answer:
          "Pilih desain di katalog, buka demonya, lalu tekan Pesan via WhatsApp. Nama, kategori, harga, dan link demo undangan pilihanmu sudah tertulis di pesan, tinggal kirim ke admin.",
      },
      {
        question: "Data apa saja yang perlu disiapkan?",
        answer:
          "Nama lengkap yang punya acara, tanggal, waktu, dan alamat acara. Siapkan juga foto bila desainnya memakai galeri, dan musik latar bila ingin memilih sendiri. Admin akan mengirim daftar lengkapnya setelah kamu memesan.",
      },
      {
        question: "Berapa lama undangan selesai dibuat?",
        answer:
          "Waktu pengerjaan bergantung pada kelengkapan data dan antrean pesanan. Admin akan menyampaikan perkiraannya saat kamu memesan.",
      },
      {
        question: "Apakah bisa revisi?",
        answer:
          "Bisa. Sampaikan bagian yang ingin diubah lewat WhatsApp sebelum undangan dibagikan. Ketentuan revisi akan dijelaskan admin saat pemesanan.",
      },
      {
        question: "Apakah desainnya bisa disesuaikan?",
        answer:
          "Teks, foto, dan susunan acara mengikuti data acaramu. Untuk perubahan warna atau elemen desain, tanyakan dulu lewat WhatsApp.",
      },
      {
        question: "Bagaimana undangan dibagikan ke tamu?",
        answer:
          "Kamu menerima satu tautan undangan yang bisa dikirim lewat WhatsApp, Instagram, atau grup keluarga. Tamu cukup membukanya di ponsel.",
      },
    ],
  },
  cta: {
    title: "Temukan desain yang cocok untuk hari spesialmu.",
    description: "Jelajahi seluruh koleksi, buka demonya, lalu pesan langsung lewat WhatsApp.",
    buttonText: "Lihat Koleksi",
    buttonLink: "/catalog",
  },
  footer: {
    description: "Katalog undangan digital premium untuk pernikahan, lamaran, ulang tahun, dan acara perusahaan.",
    instagram: "",
    whatsapp: "",
    email: "",
    copyright: "© {{year}} Heaven Inv. Seluruh hak dilindungi.",
  },
};

type Row = { section: string; key: string; value: string };

/**
 * Gabungkan baris database dengan default. Nilai yang rusak/tidak valid
 * (mis. JSON korup) jatuh kembali ke default per section, sehingga homepage
 * tidak pernah crash karena data CMS.
 */
export function mergeContent(rows: Row[]): SiteContent {
  const result = structuredClone(DEFAULT_CONTENT) as SiteContent;
  for (const section of CONTENT_SECTIONS) {
    const sectionRows = rows.filter((row) => row.section === section);
    if (sectionRows.length === 0) continue;
    const candidate: Record<string, unknown> = { ...result[section] };
    for (const row of sectionRows) {
      if (JSON_FIELDS[section]?.includes(row.key)) {
        try {
          candidate[row.key] = JSON.parse(row.value);
        } catch {
          // biarkan default
        }
      } else {
        candidate[row.key] = row.value;
      }
    }
    const parsed = CONTENT_SCHEMAS[section].safeParse(candidate);
    if (parsed.success) (result as Record<string, unknown>)[section] = parsed.data;
  }
  return result;
}

/** Objek section → baris (section, key, value) untuk disimpan. */
export function contentToRows(section: ContentSection, data: Record<string, unknown>): Row[] {
  return Object.entries(data).map(([key, value]) => ({
    section,
    key,
    value: JSON_FIELDS[section]?.includes(key) ? JSON.stringify(value) : String(value ?? ""),
  }));
}
