"use server";

import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { TAGS } from "@/lib/cache-tags";
import { CONTENT_SCHEMAS, CONTENT_SECTIONS, contentToRows, type ContentSection } from "@/lib/content/schema";
import { SETTINGS_GROUPS, type SettingsGroup } from "@/lib/settings/schema";
import { cleanupUnusedMedia } from "@/lib/storage/cleanup";
import { mutateDb } from "@/lib/store";
import { toFieldErrors, type ActionResult } from "@/lib/validation/common";

function readPayload(formData: FormData): unknown {
  try {
    return JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return null;
  }
}

/** Simpan satu section konten homepage (hero, about, whyUs, ...). */
export async function saveContentAction(
  section: ContentSection,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  if (!CONTENT_SECTIONS.includes(section)) return { ok: false, message: "Section tidak dikenal." };

  const parsed = CONTENT_SCHEMAS[section].safeParse(readPayload(formData));
  if (!parsed.success) {
    return { ok: false, message: "Periksa kembali isian yang ditandai.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const rows = contentToRows(section, parsed.data as Record<string, unknown>);
  const keys = new Set(rows.map((row) => row.key));
  const previous = await mutateDb((db) => {
    const before = db.content.filter((row) => row.section === section).map((row) => row.value);
    // Buang field lama yang sudah tidak ada di skema section ini (mis. gambar Tentang).
    db.content = db.content.filter((row) => row.section !== section || keys.has(row.key));
    for (const row of rows) {
      const existing = db.content.find((item) => item.section === row.section && item.key === row.key);
      if (existing) existing.value = row.value;
      else db.content.push(row);
    }
    return before;
  });

  // "max" = stale-while-revalidate; alasannya di actions/templates.ts (invalidate).
  revalidateTag(TAGS.content, "max");
  await cleanupUnusedMedia(previous);
  return { ok: true, message: "Konten tersimpan. Bila situs masih menampilkan versi lama, muat ulang halamannya sekali." };
}

/** Simpan satu grup pengaturan situs (brand, whatsapp, contact, seo). */
export async function saveSettingsAction(
  group: SettingsGroup,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const schema = SETTINGS_GROUPS[group];
  if (!schema) return { ok: false, message: "Grup pengaturan tidak dikenal." };

  const parsed = schema.safeParse(readPayload(formData));
  if (!parsed.success) {
    return { ok: false, message: "Periksa kembali isian yang ditandai.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const entries = Object.entries(parsed.data as Record<string, string>);
  const previous = await mutateDb((db) => {
    const before: string[] = [];
    for (const [key, value] of entries) {
      const existing = db.settings.find((row) => row.key === key);
      if (existing) {
        before.push(existing.value);
        existing.value = value;
      } else {
        db.settings.push({ key, value });
      }
    }
    return before;
  });

  revalidateTag(TAGS.settings, "max");
  await cleanupUnusedMedia(previous);
  return { ok: true, message: "Pengaturan berhasil disimpan." };
}
