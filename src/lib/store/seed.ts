import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { CONTENT_SECTIONS, DEFAULT_CONTENT, contentToRows } from "@/lib/content/schema";
import { DEFAULT_SETTINGS } from "@/lib/settings/schema";
import type { TemplateTag } from "@/lib/tags";
import type { CategoryRecord, Database, TemplateRecord } from "@/lib/store/types";

/**
 * Isi awal database dummy: 1 admin, 5 kategori, 9 template (8 publish + 1 draft),
 * pengaturan situs, dan konten homepage default. Dipakai sekali saat file
 * database dummy belum ada.
 */

export const DUMMY_ADMIN_EMAIL = "admin@heaveninv.id";
export const DUMMY_ADMIN_PASSWORD = "heaveninv123";

const CATEGORIES = [
  { slug: "wedding", name: "Wedding", description: "Undangan pernikahan untuk akad, pemberkatan, dan resepsi." },
  { slug: "engagement", name: "Engagement", description: "Kabar bahagia lamaran dan pertunangan untuk keluarga dan sahabat." },
  { slug: "birthday", name: "Birthday", description: "Pesta ulang tahun anak hingga dewasa dengan nuansa ceria." },
  { slug: "islamic", name: "Islamic", description: "Desain bernuansa islami untuk walimah, aqiqah, dan syukuran." },
  { slug: "corporate", name: "Corporate", description: "Undangan resmi untuk gala dinner, peluncuran produk, dan acara kantor." },
];

const WEDDING_FEATURES = [
  "Cover dengan nama mempelai dan tanggal acara",
  "Profil kedua mempelai beserta orang tua",
  "Detail akad dan resepsi dengan tombol peta lokasi",
  "Hitung mundur menuju hari bahagia",
  "Galeri foto prewedding",
  "Ucapan tamu dan konfirmasi kehadiran (RSVP)",
  "Musik latar pilihan",
  "Amplop digital untuk tanda kasih",
];

type SeedTemplate = {
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  tags?: TemplateTag[];
  isFeatured?: boolean;
  isPublished?: boolean;
  description: string;
  features: string[];
};

const TEMPLATES: SeedTemplate[] = [
  {
    slug: "elegant-rose",
    name: "Elegant Rose",
    category: "wedding",
    price: 149000,
    tags: ["best-seller"],
    isFeatured: true,
    description:
      "Nuansa merah muda pudar dengan rangkaian bunga mawar yang lembut. Cocok untuk pernikahan bertema romantis, dari akad yang intim hingga resepsi di gedung.",
    features: WEDDING_FEATURES,
  },
  {
    slug: "sage-botanica",
    name: "Sage Botanica",
    category: "wedding",
    price: 169000,
    tags: ["new", "best-seller"],
    isFeatured: true,
    description:
      "Hijau sage dan ranting daun yang menenangkan untuk pasangan yang menyukai suasana taman. Tata letak lapang dengan tipografi klasik yang mudah dibaca tamu.",
    features: WEDDING_FEATURES,
  },
  {
    slug: "kawung-heritage",
    name: "Kawung Heritage",
    category: "wedding",
    price: 189000,
    tags: ["premium"],
    isFeatured: true,
    description:
      "Terinspirasi motif batik kawung dengan perpaduan cokelat tua dan emas. Pas untuk pernikahan adat Jawa yang ingin tetap terlihat modern.",
    features: [
      "Cover bermotif kawung dengan nama mempelai",
      "Susunan acara adat: siraman, midodareni, panggih",
      "Profil kedua mempelai beserta orang tua",
      "Detail ijab kabul dan resepsi dengan peta lokasi",
      "Hitung mundur menuju hari bahagia",
      "Galeri foto prewedding",
      "Ucapan tamu dan konfirmasi kehadiran (RSVP)",
      "Gendhing Jawa sebagai musik latar",
    ],
  },
  {
    slug: "noor-sakinah",
    name: "Noor Sakinah",
    category: "islamic",
    price: 159000,
    tags: ["best-seller"],
    isFeatured: true,
    description:
      "Hijau zamrud dengan lengkung mihrab dan ornamen bintang delapan. Dilengkapi kutipan ayat dan doa pembuka untuk walimatul 'ursy yang khidmat.",
    features: [
      "Kutipan ayat dan doa untuk pengantin",
      "Profil kedua mempelai beserta orang tua",
      "Jadwal akad nikah dan walimah",
      "Tombol peta lokasi masjid dan gedung",
      "Hitung mundur menuju hari akad",
      "Ucapan tamu dan konfirmasi kehadiran (RSVP)",
      "Amplop digital untuk tanda kasih",
    ],
  },
  {
    slug: "ivory-promise",
    name: "Ivory Promise",
    category: "engagement",
    price: 129000,
    tags: ["new"],
    description:
      "Warna gading dengan ornamen cincin bertaut yang sederhana. Dibuat untuk mengabarkan lamaran kepada keluarga besar dengan cara yang hangat.",
    features: [
      "Cover pertunangan dengan nama pasangan",
      "Cerita singkat perjalanan kalian berdua",
      "Detail acara lamaran dengan peta lokasi",
      "Galeri foto pasangan",
      "Ucapan dan doa dari keluarga",
      "Musik latar pilihan",
    ],
  },
  {
    slug: "golden-hour",
    name: "Golden Hour",
    category: "engagement",
    price: 139000,
    originalPrice: 179000,
    tags: ["promo"],
    description:
      "Rona pasir dan cokelat terakota yang mengingatkan pada senja di tepi pantai. Ideal untuk engagement dinner atau acara lamaran di luar ruangan.",
    features: [
      "Cover bertema matahari terbenam",
      "Profil pasangan",
      "Detail engagement dan dinner",
      "Peta lokasi dan petunjuk arah",
      "Galeri foto pasangan",
      "Konfirmasi kehadiran tamu",
    ],
  },
  {
    slug: "petite-soiree",
    name: "Petite Soirée",
    category: "birthday",
    price: 99000,
    originalPrice: 129000,
    tags: ["best-seller", "promo"],
    description:
      "Balon, konfeti, dan warna peach yang ceria untuk pesta ulang tahun anak. Tetap rapi dan mudah dibaca oleh para orang tua tamu.",
    features: [
      "Cover dengan nama dan usia yang berulang tahun",
      "Susunan acara pesta",
      "Peta lokasi acara",
      "Galeri foto si kecil",
      "Konfirmasi kehadiran tamu",
      "Ucapan dan doa dari tamu",
    ],
  },
  {
    slug: "monogram-gala",
    name: "Monogram Gala",
    category: "corporate",
    price: 249000,
    tags: ["premium"],
    description:
      "Arang gelap dengan garis art deco berwarna sampanye. Memberi kesan resmi dan berkelas untuk gala dinner, peluncuran produk, atau ulang tahun perusahaan.",
    features: [
      "Cover dengan nama perusahaan dan tema acara",
      "Profil singkat acara",
      "Rundown acara",
      "Peta lokasi dan informasi parkir",
      "Konfirmasi kehadiran dengan nama instansi",
      "Kode berpakaian (dress code)",
    ],
  },
  {
    slug: "lumiere-classic",
    name: "Lumière Classic",
    category: "wedding",
    price: 139000,
    isPublished: false,
    description:
      "Bingkai ganda dan garis emas tipis di atas kertas gading. Desain klasik yang tidak lekang waktu untuk pernikahan formal.",
    features: WEDDING_FEATURES,
  },
];

export function createSeedDatabase(): Database {
  const now = new Date();
  // Selisih beberapa menit per item supaya urutan "Terbaru" punya arti.
  const stamp = (offsetMinutes: number) => new Date(now.getTime() - offsetMinutes * 60_000).toISOString();

  const email = (process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || DUMMY_ADMIN_EMAIL);
  const envPassword = process.env.SEED_ADMIN_PASSWORD ?? "";
  const password = envPassword.length >= 10 ? envPassword : DUMMY_ADMIN_PASSWORD;

  const categories: CategoryRecord[] = CATEGORIES.map((category, index) => ({
    id: randomUUID(),
    ...category,
    image: `/seed/categories/${category.slug}.webp`,
    isActive: true,
    sortOrder: index + 1,
    createdAt: stamp(1000 - index),
    updatedAt: stamp(1000 - index),
  }));
  const categoryId = new Map(categories.map((category) => [category.slug, category.id]));

  const templates: TemplateRecord[] = TEMPLATES.map((template, index) => {
    const base = `/seed/templates/${template.slug}`;
    return {
      id: randomUUID(),
      name: template.name,
      slug: template.slug,
      description: template.description,
      price: template.price,
      originalPrice: template.originalPrice ?? null,
      thumbnail: `${base}/cover.webp`,
      demoUrl: `/demo/${template.slug}`,
      tags: template.tags ?? [],
      features: template.features,
      isFeatured: template.isFeatured ?? false,
      isPublished: template.isPublished ?? true,
      sortOrder: index + 1,
      categoryId: categoryId.get(template.category)!,
      images: ["profile", "event", "gallery"].map((name, order) => ({
        id: randomUUID(),
        url: `${base}/${name}.webp`,
        sortOrder: order,
      })),
      createdAt: stamp(500 - index * 30),
      updatedAt: stamp(500 - index * 30),
    };
  });

  const settings = Object.entries({
    ...DEFAULT_SETTINGS,
    // Nomor contoh. Ganti di Admin → Settings sebelum situs dipakai.
    whatsappNumber: "6281234567890",
    instagram: "heaveninv",
    email: "halo@heaveninv.id",
    address: "Yogyakarta, Indonesia",
  }).map(([key, value]) => ({ key, value: String(value) }));

  const content = CONTENT_SECTIONS.flatMap((section) =>
    contentToRows(section, DEFAULT_CONTENT[section] as Record<string, unknown>),
  );

  return {
    version: 1,
    admins: [
      {
        id: randomUUID(),
        email,
        name: "Admin Heaven Inv",
        passwordHash: bcrypt.hashSync(password, 10),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ],
    categories,
    templates,
    content,
    settings,
  };
}
