"use server";

import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { TAGS } from "@/lib/cache-tags";
import { mutateDb, nowIso } from "@/lib/store";
import { cleanupUnusedMedia } from "@/lib/storage/cleanup";
import { categorySchema } from "@/lib/validation/catalog";
import { toFieldErrors, type ActionResult } from "@/lib/validation/common";

/*
 * revalidateTag(..., "max") (stale-while-revalidate), bukan updateTag: di Next.js 16.4,
 * cache yang langsung kedaluwarsa membuat navigasi klik pertama ke halaman detail gagal
 * ("This page couldn't load", React #412). Akibatnya kunjungan pertama setelah admin
 * menyimpan bisa masih versi lama; kunjungan berikutnya sudah baru.
 */
function invalidate() {
  revalidateTag(TAGS.categories, "max");
  revalidateTag(TAGS.templates, "max");
}

const byOrder = (a: { sortOrder: number; name: string }, b: { sortOrder: number; name: string }) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

export async function saveCategoryAction(
  categoryId: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    image: formData.get("image") ?? "",
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Periksa kembali isian yang ditandai.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const outcome = await mutateDb((db): ActionResult & { previousImage?: string | null } => {
    const existing = categoryId ? db.categories.find((item) => item.id === categoryId) : undefined;
    if (categoryId && !existing) return { ok: false, message: "Kategori tidak ditemukan. Mungkin sudah dihapus." };
    const slugOwner = db.categories.find((item) => item.slug === data.slug);
    if (slugOwner && slugOwner.id !== categoryId) {
      return { ok: false, message: "Alamat filter (slug) sudah dipakai kategori lain.", fieldErrors: { slug: "Sudah dipakai kategori lain. Ganti sedikit, mis. tambahkan angka." } };
    }
    const fields = { ...data, image: data.image || null };
    const now = nowIso();
    if (existing) {
      const previousImage = existing.image;
      Object.assign(existing, fields, { updatedAt: now });
      return { ok: true, message: `Kategori "${data.name}" diperbarui.`, previousImage };
    }
    const lastOrder = Math.max(0, ...db.categories.map((item) => item.sortOrder));
    db.categories.push({ id: randomUUID(), ...fields, sortOrder: lastOrder + 1, createdAt: now, updatedAt: now });
    return { ok: true, message: `Kategori "${data.name}" ditambahkan.` };
  });

  if (!outcome.ok) return outcome;
  invalidate();
  if (outcome.previousImage) await cleanupUnusedMedia([outcome.previousImage]);
  return { ok: true, message: outcome.message };
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  await requireAdmin();
  const outcome = await mutateDb((db): ActionResult & { image?: string | null } => {
    const category = db.categories.find((item) => item.id === categoryId);
    if (!category) return { ok: false, message: "Kategori tidak ditemukan. Mungkin sudah dihapus." };
    const used = db.templates.filter((template) => template.categoryId === categoryId).length;
    if (used > 0) {
      return {
        ok: false,
        message: `Kategori "${category.name}" masih berisi ${used} undangan. Pindahkan undangannya ke kategori lain dulu, atau sembunyikan kategori ini.`,
      };
    }
    db.categories = db.categories.filter((item) => item.id !== categoryId);
    return { ok: true, message: `Kategori "${category.name}" dihapus.`, image: category.image };
  });
  if (!outcome.ok) return outcome;
  invalidate();
  await cleanupUnusedMedia([outcome.image]);
  return { ok: true, message: outcome.message };
}

export async function setCategoryActiveAction(categoryId: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  const name = await mutateDb((db) => {
    const category = db.categories.find((item) => item.id === categoryId);
    if (!category) return null;
    category.isActive = isActive;
    category.updatedAt = nowIso();
    return category.name;
  });
  if (name === null) return { ok: false, message: "Kategori tidak ditemukan. Mungkin sudah dihapus." };
  invalidate();
  return {
    ok: true,
    message: isActive
      ? `Kategori "${name}" tampil lagi di situs.`
      : `Kategori "${name}" disembunyikan. Undangan di dalamnya ikut tidak terlihat di situs.`,
  };
}

export async function moveCategoryAction(categoryId: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();
  const moved = await mutateDb((db) => {
    const ordered = [...db.categories].sort(byOrder);
    const index = ordered.findIndex((item) => item.id === categoryId);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= ordered.length) return false;
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    ordered.forEach((item, position) => {
      item.sortOrder = position + 1;
    });
    return true;
  });
  if (!moved) return { ok: false, message: "Kategori tidak bisa digeser lebih jauh." };
  invalidate();
  return { ok: true, message: "Urutan kategori diperbarui." };
}
