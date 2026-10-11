import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { planWrites, type WritePlan } from "@/lib/store/plan";
import type { Database } from "@/lib/store/types";
import { isTemplateTag } from "@/lib/tags";

/**
 * Driver Postgres (Neon) lewat Prisma. Bentuk data sama persis dengan
 * database dummy (lib/store/types.ts), jadi query & server action tidak perlu
 * tahu driver mana yang aktif.
 *
 * Katalog ini kecil (puluhan baris), jadi setiap baca memuat seluruh tabel
 * dalam satu putaran paralel; halaman publik sudah di-cache ("use cache").
 * Setiap mutasi berjalan di satu transaksi dengan advisory lock, sehingga
 * perubahan dari beberapa instance serverless tetap berurutan, lalu hanya
 * baris yang berubah yang ditulis (lib/store/plan.ts).
 */

type Client = PrismaClient | Prisma.TransactionClient;

/** Kunci advisory lock untuk mutasi database Heaven Inv (angka bebas, tetap). */
const MUTATION_LOCK = 724519;

/** Antrekan transaksi ini di belakang mutasi lain (lepas otomatis saat commit/rollback). */
export async function lockMutations(tx: Prisma.TransactionClient): Promise<void> {
  await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${MUTATION_LOCK})`);
}

const globalPrisma = globalThis as unknown as { __heavenPrisma?: PrismaClient };

export function createPrisma(connectionString = process.env.DATABASE_URL, max = 3): PrismaClient {
  if (!connectionString) throw new Error("DATABASE_URL belum diset.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max }) });
}

/** Satu client per proses (dev HMR dan serverless memakai ulang koneksi). */
export function getPrisma(): PrismaClient {
  globalPrisma.__heavenPrisma ??= createPrisma();
  return globalPrisma.__heavenPrisma;
}

const iso = (value: Date) => value.toISOString();

export async function loadDatabase(client: Client): Promise<Database> {
  const [admins, categories, templates, content, settings] = await Promise.all([
    client.admin.findMany({ orderBy: { createdAt: "asc" } }),
    client.category.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    client.template.findMany({
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    client.siteContent.findMany({ orderBy: [{ section: "asc" }, { key: "asc" }] }),
    client.siteSettings.findMany({ orderBy: { key: "asc" } }),
  ]);
  return {
    version: 1,
    admins: admins.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    })),
    categories: categories.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image: row.image,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    })),
    templates: templates.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: row.price,
      originalPrice: row.originalPrice,
      thumbnail: row.thumbnail,
      demoUrl: row.demoUrl,
      tags: row.tags.filter(isTemplateTag),
      features: row.features,
      isFeatured: row.isFeatured,
      isPublished: row.isPublished,
      sortOrder: row.sortOrder,
      categoryId: row.categoryId,
      images: row.images.map((image) => ({ id: image.id, url: image.url, sortOrder: image.sortOrder })),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    })),
    content: content.map((row) => ({ section: row.section, key: row.key, value: row.value })),
    settings: settings.map((row) => ({ key: row.key, value: row.value })),
  };
}

/**
 * Tulis rencana perubahan. Urutan menjaga foreign key & slug unik:
 * hapus template → hapus kategori yang sudah tidak dipakai → upsert kategori
 * → upsert template (+ galeri) → hapus sisa kategori. Menghapus lebih dulu
 * membebaskan slug lama, mis. saat impor membawa kategori yang sama dengan ID baru.
 */
export async function applyPlan(tx: Prisma.TransactionClient, plan: WritePlan): Promise<void> {
  if (plan.templates.remove.length) await tx.template.deleteMany({ where: { id: { in: plan.templates.remove } } });

  let categoriesToRemove = plan.categories.remove;
  if (categoriesToRemove.length) {
    const used = await tx.template.findMany({
      where: { categoryId: { in: categoriesToRemove } },
      select: { categoryId: true },
      distinct: ["categoryId"],
    });
    const stillUsed = new Set(used.map((row) => row.categoryId));
    const unused = categoriesToRemove.filter((id) => !stillUsed.has(id));
    if (unused.length) await tx.category.deleteMany({ where: { id: { in: unused } } });
    categoriesToRemove = categoriesToRemove.filter((id) => stillUsed.has(id));
  }

  for (const row of plan.categories.upsert) {
    const data = {
      name: row.name,
      slug: row.slug,
      description: row.description,
      image: row.image,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
    await tx.category.upsert({ where: { id: row.id }, create: { id: row.id, ...data }, update: data });
  }

  for (const row of plan.templates.upsert) {
    const data = {
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: row.price,
      originalPrice: row.originalPrice ?? null,
      thumbnail: row.thumbnail,
      demoUrl: row.demoUrl,
      tags: row.tags,
      features: row.features,
      isFeatured: row.isFeatured,
      isPublished: row.isPublished,
      sortOrder: row.sortOrder,
      categoryId: row.categoryId,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
    await tx.template.upsert({ where: { id: row.id }, create: { id: row.id, ...data }, update: data });
    await tx.templateImage.deleteMany({ where: { templateId: row.id } });
    if (row.images.length) {
      await tx.templateImage.createMany({
        data: row.images.map((image) => ({ id: image.id, templateId: row.id, url: image.url, sortOrder: image.sortOrder })),
      });
    }
  }

  if (categoriesToRemove.length) await tx.category.deleteMany({ where: { id: { in: categoriesToRemove } } });

  for (const row of plan.admins.upsert) {
    const data = {
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
    await tx.admin.upsert({ where: { id: row.id }, create: { id: row.id, ...data }, update: data });
  }
  if (plan.admins.remove.length) await tx.admin.deleteMany({ where: { id: { in: plan.admins.remove } } });

  for (const row of plan.content.upsert) {
    await tx.siteContent.upsert({
      where: { section_key: { section: row.section, key: row.key } },
      create: { section: row.section, key: row.key, value: row.value },
      update: { value: row.value },
    });
  }
  for (const row of plan.content.remove) {
    await tx.siteContent.deleteMany({ where: { section: row.section, key: row.key } });
  }

  for (const row of plan.settings.upsert) {
    await tx.siteSettings.upsert({ where: { key: row.key }, create: { key: row.key, value: row.value }, update: { value: row.value } });
  }
  if (plan.settings.remove.length) await tx.siteSettings.deleteMany({ where: { key: { in: plan.settings.remove } } });
}

/**
 * Transaksi berurutan: kunci → baca → jalankan fn pada salinan → tulis selisih.
 * fn boleh async (mis. hash password); batas waktu transaksi 20 detik.
 */
export async function mutateWith<T>(prisma: PrismaClient, fn: (db: Database) => T | Promise<T>): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await lockMutations(tx);
      const before = await loadDatabase(tx);
      const draft = structuredClone(before);
      const result = await fn(draft);
      await applyPlan(tx, planWrites(before, draft));
      return result;
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
}

export function readPostgresDb(): Promise<Database> {
  return loadDatabase(getPrisma());
}

export function mutatePostgresDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  return mutateWith(getPrisma(), fn);
}
