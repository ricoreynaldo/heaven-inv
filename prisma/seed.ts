/**
 * Seed Heaven Inv: admin awal, 5 kategori, 9 template (8 publish + 1 draft),
 * pengaturan situs, dan konten homepage default.
 *
 * Idempoten: data yang sudah ada tidak ditimpa, sehingga aman dijalankan ulang
 * tanpa menghapus perubahan admin. Set SEED_RESET_ADMIN_PASSWORD=1 untuk
 * mengganti password admin seed dengan nilai di .env.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CONTENT_SECTIONS, DEFAULT_CONTENT, contentToRows } from "../src/lib/content/schema";
import { DEFAULT_SETTINGS } from "../src/lib/settings/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL belum diset.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 2 }) });

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

/** Badge lama → tag katalog baru (lihat src/lib/tags.ts). */
const BADGE_TO_TAG: Record<string, string> = { Terlaris: "best-seller", Baru: "new", Premium: "premium", Promo: "promo" };

type SeedTemplate = {
  slug: string;
  name: string;
  category: string;
  price: number;
  badge?: string;
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
    badge: "Terlaris",
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
    badge: "Baru",
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
    badge: "Premium",
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
    badge: "Baru",
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
    badge: "Premium",
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

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD kosong: admin tidak dibuat. Gunakan `npm run admin:create`.");
    return;
  }
  if (password.length < 10) throw new Error("SEED_ADMIN_PASSWORD minimal 10 karakter.");
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing && process.env.SEED_RESET_ADMIN_PASSWORD !== "1") {
    console.log(`admin: ${email} sudah ada (password tidak diubah)`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.admin.upsert({
    where: { email },
    create: { email, name: "Admin Heaven Inv", passwordHash },
    update: { passwordHash },
  });
  console.log(`admin: ${email} siap`);
}

async function seedCatalog() {
  const categoryIds = new Map<string, string>();
  for (const [index, category] of CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, image: `/seed/categories/${category.slug}.webp`, sortOrder: index + 1 },
      update: {},
    });
    categoryIds.set(category.slug, row.id);
  }

  for (const [index, template] of TEMPLATES.entries()) {
    const exists = await prisma.template.findUnique({ where: { slug: template.slug }, select: { id: true } });
    if (exists) continue;
    const base = `/seed/templates/${template.slug}`;
    await prisma.template.create({
      data: {
        name: template.name,
        slug: template.slug,
        description: template.description,
        price: template.price,
        thumbnail: `${base}/cover.webp`,
        demoUrl: `/demo/${template.slug}`,
        tags: template.badge ? [BADGE_TO_TAG[template.badge] ?? "new"] : [],
        features: template.features,
        isFeatured: template.isFeatured ?? false,
        isPublished: template.isPublished ?? true,
        sortOrder: index + 1,
        categoryId: categoryIds.get(template.category)!,
        images: {
          create: ["profile", "event", "gallery"].map((name, order) => ({ url: `${base}/${name}.webp`, sortOrder: order })),
        },
      },
    });
  }
  console.log(`katalog: ${CATEGORIES.length} kategori, ${TEMPLATES.length} template`);
}

async function seedSite() {
  const settings: Record<string, string> = {
    ...DEFAULT_SETTINGS,
    // Nomor contoh. Ganti di Admin → Settings sebelum situs dipakai.
    whatsappNumber: "6281234567890",
    instagram: "heaveninv",
    email: "halo@heaveninv.id",
    address: "Yogyakarta, Indonesia",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSettings.upsert({ where: { key }, create: { key, value }, update: {} });
  }
  for (const section of CONTENT_SECTIONS) {
    for (const row of contentToRows(section, DEFAULT_CONTENT[section] as Record<string, unknown>)) {
      await prisma.siteContent.upsert({
        where: { section_key: { section: row.section, key: row.key } },
        create: row,
        update: {},
      });
    }
  }
  console.log("pengaturan & konten homepage siap");
}

async function main() {
  await seedAdmin();
  await seedCatalog();
  await seedSite();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
