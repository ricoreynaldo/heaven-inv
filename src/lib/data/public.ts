import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { TAGS, templateTag } from "@/lib/cache-tags";
import { mergeContent, type SiteContent } from "@/lib/content/schema";
import { mergeSettings, type SiteSettings } from "@/lib/settings/schema";
import { visibleOriginalPrice } from "@/lib/pricing";
import { readDb, type Database } from "@/lib/store";
import type { TemplateRecord } from "@/lib/store/types";
import type { TemplateTag } from "@/lib/tags";
import type { CatalogQuery } from "@/lib/validation/catalog";

/**
 * Query untuk halaman publik. Semuanya `use cache` + cacheTag sehingga ikut
 * prerender (static shell) dan diperbarui setelah admin menyimpan perubahan
 * (server action memanggil revalidateTag(tag, "max") dengan tag yang sama).
 *
 * Sumber data: lib/store (database dummy JSON di laptop, Postgres/Neon di Vercel).
 */

export const CATALOG_PAGE_SIZE = 12;

export type TemplateCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  /** Harga coret (sebelum diskon); null bila bukan promo. */
  originalPrice: number | null;
  thumbnail: string;
  /** Halaman isi pertama, ditampilkan saat kartu di-hover (pratinjau cepat). */
  previewImage: string | null;
  tags: TemplateTag[];
  isFeatured: boolean;
  demoUrl: string | null;
  category: { name: string; slug: string };
};

export type TemplateDetailData = TemplateCardData & {
  description: string;
  features: string[];
  categoryId: string;
  updatedAt: string;
  images: { id: string; url: string }[];
};

export type CategoryCardData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  templateCount: number;
};

/** Template yang boleh tampil: published dan kategorinya aktif. */
function publicTemplates(db: Database) {
  const active = new Map(db.categories.filter((category) => category.isActive).map((category) => [category.id, category]));
  return db.templates
    .filter((template) => template.isPublished && active.has(template.categoryId))
    .map((template) => ({ template, category: active.get(template.categoryId)! }));
}

type PublicRow = ReturnType<typeof publicTemplates>[number];

const bySortOrder = (a: PublicRow, b: PublicRow) =>
  a.template.sortOrder - b.template.sortOrder || b.template.createdAt.localeCompare(a.template.createdAt);

function toCard({ template, category }: PublicRow): TemplateCardData {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    price: template.price,
    originalPrice: visibleOriginalPrice(template),
    thumbnail: template.thumbnail,
    previewImage: [...template.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ?? null,
    tags: template.tags,
    isFeatured: template.isFeatured,
    demoUrl: template.demoUrl,
    category: { name: category.name, slug: category.slug },
  };
}

function toDetail(row: PublicRow): TemplateDetailData {
  const { template } = row;
  return {
    ...toCard(row),
    description: template.description,
    features: template.features,
    categoryId: template.categoryId,
    updatedAt: template.updatedAt,
    images: [...template.images].sort((a, b) => a.sortOrder - b.sortOrder).map(({ id, url }) => ({ id, url })),
  };
}

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.settings);
  const db = await readDb();
  return mergeSettings(db.settings);
}

export async function getContent(): Promise<SiteContent> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.content);
  const db = await readDb();
  const content = mergeContent(db.content);
  content.footer.copyright = content.footer.copyright.replace(/\{\{\s*year\s*\}\}/g, String(new Date().getFullYear()));
  return content;
}

export async function getActiveCategories(): Promise<CategoryCardData[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.categories, TAGS.templates);
  const db = await readDb();
  const visible = publicTemplates(db);
  return db.categories
    .filter((category) => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      templateCount: visible.filter((row) => row.category.id === category.id).length,
    }));
}

export async function getFeaturedTemplates(limit = 6): Promise<TemplateCardData[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.templates, TAGS.categories);
  const db = await readDb();
  return publicTemplates(db)
    .filter((row) => row.template.isFeatured)
    .sort(bySortOrder)
    .slice(0, limit)
    .map(toCard);
}

export async function getTaggedTemplates(tag: TemplateTag, limit = 8): Promise<TemplateCardData[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.templates, TAGS.categories);
  const db = await readDb();
  return publicTemplates(db)
    .filter((row) => row.template.tags.includes(tag))
    .sort(bySortOrder)
    .slice(0, limit)
    .map(toCard);
}

export type CatalogResult = {
  items: TemplateCardData[];
  total: number;
  page: number;
  pageCount: number;
};

function matchesQuery(row: PublicRow, q: string) {
  const needle = q.toLowerCase();
  const { template, category } = row;
  return [template.name, template.description, category.name, ...template.tags].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

export async function searchTemplates(query: CatalogQuery): Promise<CatalogResult> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.templates, TAGS.categories);
  const db = await readDb();

  let rows = publicTemplates(db);
  if (query.category) rows = rows.filter((row) => row.category.slug === query.category);
  if (query.tag) rows = rows.filter((row) => row.template.tags.includes(query.tag as TemplateTag));
  if (query.q) rows = rows.filter((row) => matchesQuery(row, query.q));

  const compare: Record<CatalogQuery["sort"], (a: PublicRow, b: PublicRow) => number> = {
    recommended: bySortOrder,
    newest: (a, b) => b.template.createdAt.localeCompare(a.template.createdAt),
    "price-asc": (a, b) => a.template.price - b.template.price || bySortOrder(a, b),
    "price-desc": (a, b) => b.template.price - a.template.price || bySortOrder(a, b),
  };
  rows.sort(compare[query.sort]);

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const items = rows.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE).map(toCard);
  return { items, total, page, pageCount };
}

export async function getTemplateBySlug(slug: string): Promise<TemplateDetailData | null> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.templates, TAGS.categories, templateTag(slug));
  const db = await readDb();
  const row = publicTemplates(db).find((item) => item.template.slug === slug);
  return row ? toDetail(row) : null;
}

export async function getRelatedTemplates(categoryId: string, excludeId: string, limit = 4): Promise<TemplateCardData[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.templates, TAGS.categories);
  const db = await readDb();
  const rows = publicTemplates(db).filter((row) => row.template.id !== excludeId);
  const sameCategory = rows.filter((row) => row.template.categoryId === categoryId).sort(bySortOrder);
  const others = rows
    .filter((row) => row.template.categoryId !== categoryId)
    .sort((a, b) => Number(b.template.isFeatured) - Number(a.template.isFeatured) || bySortOrder(a, b));
  return [...sameCategory, ...others].slice(0, limit).map(toCard);
}

export type SearchItem = Pick<TemplateCardData, "slug" | "name" | "price" | "originalPrice" | "thumbnail" | "tags"> & {
  category: string;
  /** Teks yang dicocokkan pencarian instan (nama, kategori, tag, deskripsi), huruf kecil. */
  haystack: string;
};

/** Indeks ringan untuk pencarian instan di header (dicari di browser, katalog kecil). */
export async function getSearchIndex(): Promise<SearchItem[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.templates, TAGS.categories);
  const db = await readDb();
  return publicTemplates(db)
    .sort(bySortOrder)
    .map((row) => {
      const card = toCard(row);
      return {
        slug: card.slug,
        name: card.name,
        price: card.price,
        originalPrice: card.originalPrice,
        thumbnail: card.thumbnail,
        tags: card.tags,
        category: card.category.name,
        haystack: [card.name, card.category.name, row.template.description, ...card.tags.map((tag) => tag.replace("-", " "))]
          .join(" ")
          .toLowerCase(),
      };
    });
}

export async function getPublishedSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.templates, TAGS.categories);
  const db = await readDb();
  return publicTemplates(db)
    .sort(bySortOrder)
    .map(({ template }: { template: TemplateRecord }) => ({ slug: template.slug, updatedAt: template.updatedAt }));
}
