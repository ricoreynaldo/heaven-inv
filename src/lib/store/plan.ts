import type { AdminRecord, CategoryRecord, ContentRow, Database, SettingRow, TemplateRecord } from "@/lib/store/types";

/**
 * Selisih antara dua snapshot database: baris yang perlu dibuat/diubah
 * (upsert) dan yang perlu dihapus. Dipakai driver Postgres supaya mutasi
 * yang ditulis untuk database dummy (ubah objek `db` di memori) cukup
 * diterjemahkan menjadi perubahan baris yang benar-benar berubah.
 * Murni (tanpa I/O) supaya mudah diuji.
 */
export type WritePlan = {
  admins: { upsert: AdminRecord[]; remove: string[] };
  categories: { upsert: CategoryRecord[]; remove: string[] };
  /** Template yang di-upsert ikut mengganti seluruh galerinya. */
  templates: { upsert: TemplateRecord[]; remove: string[] };
  content: { upsert: ContentRow[]; remove: { section: string; key: string }[] };
  settings: { upsert: SettingRow[]; remove: string[] };
};

/** Bentuk baku untuk dibandingkan: urutan kolom diabaikan; null, undefined, dan kolom kosong dianggap sama. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return Object.fromEntries(
        Object.entries(item)
          .filter(([, field]) => field !== null && field !== undefined)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
    }
    return item;
  });
}

function diffBy<T>(before: T[], after: T[], keyOf: (item: T) => string) {
  const previous = new Map(before.map((item) => [keyOf(item), canonical(item)]));
  const next = new Set(after.map(keyOf));
  return {
    upsert: after.filter((item) => previous.get(keyOf(item)) !== canonical(item)),
    remove: [...previous.keys()].filter((key) => !next.has(key)),
  };
}

const contentKey = (row: { section: string; key: string }) => `${row.section}\u0000${row.key}`;

export function planWrites(before: Database, after: Database): WritePlan {
  const content = diffBy(before.content, after.content, contentKey);
  return {
    admins: diffBy(before.admins, after.admins, (row) => row.id),
    categories: diffBy(before.categories, after.categories, (row) => row.id),
    templates: diffBy(before.templates, after.templates, (row) => row.id),
    content: {
      upsert: content.upsert,
      remove: content.remove.map((key) => {
        const [section = "", name = ""] = key.split("\u0000");
        return { section, key: name };
      }),
    },
    settings: diffBy(before.settings, after.settings, (row) => row.key),
  };
}

export function isEmptyPlan(plan: WritePlan): boolean {
  return Object.values(plan).every((table) => table.upsert.length === 0 && table.remove.length === 0);
}

export const EMPTY_DATABASE: Database = { version: 1, admins: [], categories: [], templates: [], content: [], settings: [] };
