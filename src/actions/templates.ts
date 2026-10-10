"use server";

import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { TAGS, templateTag } from "@/lib/cache-tags";
import { mutateDb, nowIso } from "@/lib/store";
import type { Database, TemplateRecord } from "@/lib/store/types";
import { cleanupUnusedMedia } from "@/lib/storage/cleanup";
import { sortTags, tagLabel, type TemplateTag } from "@/lib/tags";
import { templateSchema } from "@/lib/validation/catalog";
import { toFieldErrors, type ActionResult } from "@/lib/validation/common";

/*
 * revalidateTag(..., "max") (stale-while-revalidate), bukan updateTag: di Next.js 16.4,
 * cache yang langsung kedaluwarsa membuat navigasi klik pertama ke halaman detail gagal
 * ("This page couldn't load", React #412). Akibatnya kunjungan pertama setelah admin
 * menyimpan bisa masih versi lama; kunjungan berikutnya sudah baru.
 */
function invalidate(...slugs: string[]) {
  revalidateTag(TAGS.templates, "max");
  for (const slug of new Set(slugs)) revalidateTag(templateTag(slug), "max");
}

const bySortOrder = (a: TemplateRecord, b: TemplateRecord) =>
  a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt);

function readTemplateForm(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    price: formData.get("price") ?? "",
    originalPrice: formData.get("originalPrice") ?? "",
    thumbnail: formData.get("thumbnail") ?? "",
    gallery: formData.getAll("gallery").map(String).filter(Boolean),
    demoUrl: formData.get("demoUrl") ?? "",
    tags: formData.getAll("tags").map(String).filter(Boolean),
    features: String(formData.get("features") ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    isFeatured: formData.get("isFeatured"),
    isPublished: formData.get("isPublished"),
  };
}

/** Ubah satu template di database; null bila tidak ditemukan. */
function updateTemplate(db: Database, id: string, patch: Partial<TemplateRecord>) {
  const template = db.templates.find((item) => item.id === id);
  if (!template) return null;
  Object.assign(template, patch, { updatedAt: nowIso() });
  return { name: template.name, slug: template.slug };
}

export async function saveTemplateAction(
  templateId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = templateSchema.safeParse(readTemplateForm(formData));
  if (!parsed.success) {
    return { ok: false, message: "Periksa kembali isian yang ditandai.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const outcome = await mutateDb((db): ActionResult<{ id: string }> & { previous?: TemplateRecord } => {
    const existing = templateId ? db.templates.find((item) => item.id === templateId) : undefined;
    if (templateId && !existing) return { ok: false, message: "Undangan tidak ditemukan. Mungkin sudah dihapus." };
    if (!db.categories.some((category) => category.id === data.categoryId)) {
      return { ok: false, message: "Kategori tidak ditemukan.", fieldErrors: { categoryId: "Pilih kategori yang tersedia." } };
    }
    const slugOwner = db.templates.find((item) => item.slug === data.slug);
    if (slugOwner && slugOwner.id !== templateId) {
      return { ok: false, message: "Alamat halaman (slug) sudah dipakai undangan lain.", fieldErrors: { slug: "Sudah dipakai undangan lain. Ganti sedikit, mis. tambahkan angka." } };
    }

    const fields = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      categoryId: data.categoryId,
      price: data.price,
      // Harga coret hanya berlaku selama tag Promo terpasang.
      originalPrice: data.tags.includes("promo") ? (data.originalPrice ?? null) : null,
      thumbnail: data.thumbnail,
      demoUrl: data.demoUrl || null,
      tags: sortTags(data.tags),
      features: data.features,
      isFeatured: data.isFeatured,
      isPublished: data.isPublished,
      images: data.gallery.map((url, index) => ({ id: randomUUID(), url, sortOrder: index })),
    };
    const now = nowIso();

    if (existing) {
      const previous = structuredClone(existing);
      Object.assign(existing, fields, { updatedAt: now });
      return { ok: true, message: `"${data.name}" berhasil diperbarui.`, data: { id: existing.id }, previous };
    }
    const id = randomUUID();
    const lastOrder = Math.max(0, ...db.templates.map((item) => item.sortOrder));
    db.templates.push({ id, ...fields, sortOrder: lastOrder + 1, createdAt: now, updatedAt: now });
    return { ok: true, message: `"${data.name}" berhasil ditambahkan.`, data: { id } };
  });

  if (!outcome.ok) return outcome;
  const { previous, ...result } = outcome;
  invalidate(data.slug, ...(previous ? [previous.slug] : []));
  if (previous) await cleanupUnusedMedia([previous.thumbnail, ...previous.images.map((image) => image.url)]);
  return result;
}

export async function deleteTemplateAction(templateId: string): Promise<ActionResult> {
  await requireAdmin();
  const removed = await mutateDb((db) => {
    const template = db.templates.find((item) => item.id === templateId);
    if (!template) return null;
    db.templates = db.templates.filter((item) => item.id !== templateId);
    return template;
  });
  if (!removed) return { ok: false, message: "Undangan tidak ditemukan. Mungkin sudah dihapus." };
  invalidate(removed.slug);
  await cleanupUnusedMedia([removed.thumbnail, ...removed.images.map((image) => image.url)]);
  return { ok: true, message: `"${removed.name}" dihapus dari katalog.` };
}

export async function setTemplatePublishedAction(templateId: string, isPublished: boolean): Promise<ActionResult> {
  await requireAdmin();
  const template = await mutateDb((db) => updateTemplate(db, templateId, { isPublished }));
  if (!template) return { ok: false, message: "Undangan tidak ditemukan." };
  invalidate(template.slug);
  return {
    ok: true,
    message: isPublished ? `"${template.name}" dipublikasikan ke situs.` : `"${template.name}" disembunyikan (draft).`,
  };
}

export async function setTemplateFeaturedAction(templateId: string, isFeatured: boolean): Promise<ActionResult> {
  await requireAdmin();
  const template = await mutateDb((db) => updateTemplate(db, templateId, { isFeatured }));
  if (!template) return { ok: false, message: "Undangan tidak ditemukan." };
  invalidate(template.slug);
  return {
    ok: true,
    message: isFeatured ? `"${template.name}" tampil di beranda (Koleksi Pilihan).` : `"${template.name}" dikeluarkan dari beranda.`,
  };
}

/** Pasang/lepas satu tag (mis. Best Seller) langsung dari tabel admin. */
export async function toggleTemplateTagAction(templateId: string, tag: TemplateTag, enabled: boolean): Promise<ActionResult> {
  await requireAdmin();
  const template = await mutateDb((db) => {
    const current = db.templates.find((item) => item.id === templateId);
    if (!current) return null;
    const tags = enabled ? [...current.tags, tag] : current.tags.filter((value) => value !== tag);
    return updateTemplate(db, templateId, { tags: sortTags(tags) });
  });
  if (!template) return { ok: false, message: "Undangan tidak ditemukan." };
  invalidate(template.slug);
  const label = tagLabel(tag);
  return { ok: true, message: enabled ? `Tag ${label} dipasang di "${template.name}".` : `Tag ${label} dilepas dari "${template.name}".` };
}

/** Geser template satu posisi di urutan katalog ("recommended"). */
export async function moveTemplateAction(templateId: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();
  const result = await mutateDb((db): ActionResult => {
    const ordered = [...db.templates].sort(bySortOrder);
    const index = ordered.findIndex((item) => item.id === templateId);
    if (index === -1) return { ok: false, message: "Undangan tidak ditemukan." };
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ordered.length) {
      return { ok: false, message: direction === "up" ? "Sudah di urutan teratas." : "Sudah di urutan terbawah." };
    }
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    // Normalisasi menjadi 1..n supaya urutan tidak pernah ambigu (nilai kembar).
    ordered.forEach((item, position) => {
      item.sortOrder = position + 1;
    });
    return { ok: true, message: "Urutan katalog diperbarui." };
  });
  if (result.ok) revalidateTag(TAGS.templates, "max");
  return result;
}
