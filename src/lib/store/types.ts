import type { TemplateTag } from "@/lib/tags";

/**
 * Bentuk data database dummy. Sengaja mengikuti model Prisma di
 * prisma/schema.prisma supaya nanti tinggal diganti ke Postgres tanpa
 * mengubah komponen. Tanggal disimpan sebagai ISO string.
 */

export type AdminRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TemplateImageRecord = {
  id: string;
  url: string;
  sortOrder: number;
};

export type TemplateRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Harga dalam Rupiah (bilangan bulat). Saat promo = harga promo. */
  price: number;
  /** Harga sebelum diskon (ditampilkan dicoret). Hanya terisi bila tag Promo dipasang. */
  originalPrice?: number | null;
  thumbnail: string;
  demoUrl: string | null;
  tags: TemplateTag[];
  features: string[];
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  categoryId: string;
  images: TemplateImageRecord[];
  createdAt: string;
  updatedAt: string;
};

export type ContentRow = { section: string; key: string; value: string };
export type SettingRow = { key: string; value: string };

export type Database = {
  version: 1;
  admins: AdminRecord[];
  categories: CategoryRecord[];
  templates: TemplateRecord[];
  content: ContentRow[];
  settings: SettingRow[];
};
