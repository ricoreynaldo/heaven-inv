import "server-only";
import { mergeContent } from "@/lib/content/schema";
import { mergeSettings } from "@/lib/settings/schema";
import { visibleOriginalPrice } from "@/lib/pricing";
import { readDb } from "@/lib/store";
import type { TemplateRecord } from "@/lib/store/types";
import { isTemplateTag, type TemplateTag } from "@/lib/tags";

/**
 * Query untuk panel admin: selalu segar (tanpa cache) karena admin harus
 * melihat hasil perubahannya sendiri. Halaman pemanggil sudah memanggil
 * requireAdmin() sebelumnya. Sumber data: lib/store (dummy JSON atau Postgres).
 */

export const ADMIN_PAGE_SIZE = 15;

const bySortOrder = (a: TemplateRecord, b: TemplateRecord) =>
  a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt);

export async function getDashboardStats() {
  const db = await readDb();
  const total = db.templates.length;
  const published = db.templates.filter((template) => template.isPublished).length;
  return {
    total,
    published,
    draft: total - published,
    featured: db.templates.filter((template) => template.isFeatured).length,
    bestSeller: db.templates.filter((template) => template.tags.includes("best-seller")).length,
    categories: db.categories.length,
    activeCategories: db.categories.filter((category) => category.isActive).length,
  };
}

export async function getRecentTemplates(limit = 5) {
  const db = await readDb();
  const categories = new Map(db.categories.map((category) => [category.id, category]));
  return [...db.templates]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
    .map((template) => ({
      id: template.id,
      name: template.name,
      thumbnail: template.thumbnail,
      price: template.price,
      tags: template.tags,
      isPublished: template.isPublished,
      isFeatured: template.isFeatured,
      updatedAt: template.updatedAt,
      category: { name: categories.get(template.categoryId)?.name ?? "-" },
    }));
}

export type AdminTemplateFilter = {
  q: string;
  status: "all" | "published" | "draft" | "featured";
  category: string;
  tag: TemplateTag | "";
  page: number;
};

export function parseAdminTemplateFilter(params: Record<string, string | string[] | undefined>): AdminTemplateFilter {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const status = first(params.status);
  const tag = first(params.tag);
  const page = Number.parseInt(first(params.page), 10);
  return {
    q: first(params.q).trim().slice(0, 80),
    status: status === "published" || status === "draft" || status === "featured" ? status : "all",
    category: first(params.category).trim().slice(0, 60),
    tag: isTemplateTag(tag) ? tag : "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export async function listAdminTemplates(filter: AdminTemplateFilter) {
  const db = await readDb();
  const categories = new Map(db.categories.map((category) => [category.id, category]));
  let rows = [...db.templates].sort(bySortOrder);
  if (filter.q) {
    const needle = filter.q.toLowerCase();
    rows = rows.filter((row) => row.name.toLowerCase().includes(needle) || row.slug.includes(needle));
  }
  if (filter.status === "published") rows = rows.filter((row) => row.isPublished);
  if (filter.status === "draft") rows = rows.filter((row) => !row.isPublished);
  if (filter.status === "featured") rows = rows.filter((row) => row.isFeatured);
  if (filter.category) rows = rows.filter((row) => row.categoryId === filter.category);
  if (filter.tag) rows = rows.filter((row) => row.tags.includes(filter.tag as TemplateTag));

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(filter.page, pageCount);
  const items = rows.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE).map((row) => {
    const category = categories.get(row.categoryId);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      originalPrice: visibleOriginalPrice(row),
      thumbnail: row.thumbnail,
      demoUrl: row.demoUrl,
      tags: row.tags,
      isFeatured: row.isFeatured,
      isPublished: row.isPublished,
      sortOrder: row.sortOrder,
      updatedAt: row.updatedAt,
      category: { id: row.categoryId, name: category?.name ?? "-", isActive: category?.isActive ?? false },
      imageCount: row.images.length,
    };
  });
  const all = db.templates;
  const counts = {
    all: all.length,
    published: all.filter((row) => row.isPublished).length,
    draft: all.filter((row) => !row.isPublished).length,
    bestSeller: all.filter((row) => row.tags.includes("best-seller")).length,
    featured: all.filter((row) => row.isFeatured).length,
  };
  return { items, total, allTotal: all.length, counts, page, pageCount };
}

export async function getTemplateForEdit(id: string) {
  const db = await readDb();
  const template = db.templates.find((item) => item.id === id);
  if (!template) return null;
  const category = db.categories.find((item) => item.id === template.categoryId);
  return {
    ...template,
    images: [...template.images].sort((a, b) => a.sortOrder - b.sortOrder),
    category: { name: category?.name ?? "-", slug: category?.slug ?? "" },
  };
}

export async function listCategoryOptions() {
  const db = await readDb();
  return [...db.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map(({ id, name, isActive }) => ({ id, name, isActive }));
}

export async function listAdminCategories() {
  const db = await readDb();
  return [...db.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((category) => ({
      ...category,
      templateCount: db.templates.filter((template) => template.categoryId === category.id).length,
    }));
}

export async function getAdminContent() {
  const db = await readDb();
  return mergeContent(db.content);
}

export async function getAdminSettings() {
  const db = await readDb();
  return mergeSettings(db.settings);
}

/** Template published pertama, untuk pratinjau pesan WhatsApp di Settings. */
export async function getSampleTemplate() {
  const db = await readDb();
  const template = [...db.templates].filter((item) => item.isPublished).sort(bySortOrder)[0];
  if (!template) return null;
  const category = db.categories.find((item) => item.id === template.categoryId);
  return { name: template.name, price: template.price, demoUrl: template.demoUrl, category: { name: category?.name ?? "-" } };
}
