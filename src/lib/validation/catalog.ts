import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";
import { TAG_VALUES, isTemplateTag, type TemplateTag } from "@/lib/tags";
import { demoUrl, imageUrl, optionalImageUrl, requiredText, text } from "@/lib/validation/common";

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug minimal 2 karakter.")
  .max(80, "Slug maksimal 80 karakter.")
  .regex(SLUG_PATTERN, "Slug hanya huruf kecil, angka, dan tanda hubung (mis. elegant-rose).");

const checkbox = z.preprocess((value) => value === true || value === "on" || value === "true", z.boolean());

/** "149.000" | "Rp149000" → 149000; kosong → undefined. */
const rupiahDigits = (value: unknown) => {
  if (typeof value !== "string") return value;
  const digits = value.replace(/[^\d]/g, "");
  return digits === "" ? undefined : Number(digits);
};

export const templateSchema = z
  .object({
  name: requiredText(80, "Nama template"),
  slug,
  description: text(2000, "Deskripsi"),
  categoryId: z.string().trim().min(1, "Pilih kategori."),
  price: z.preprocess(
    rupiahDigits,
    z
      .number({ message: "Harga wajib diisi." })
      .int("Harga harus bilangan bulat.")
      .min(0, "Harga tidak boleh negatif.")
      .max(100_000_000, "Harga terlalu besar."),
  ),
  /** Harga sebelum diskon (harga coret). Hanya dipakai bila tag Promo dipasang. */
  originalPrice: z.preprocess(
    rupiahDigits,
    z.number().int("Harga harus bilangan bulat.").min(0).max(100_000_000, "Harga terlalu besar.").optional(),
  ),
  thumbnail: imageUrl,
  gallery: z.array(imageUrl).max(12, "Maksimal 12 gambar galeri."),
  demoUrl,
  tags: z.array(z.enum(TAG_VALUES, { message: "Tag tidak dikenal." })).max(TAG_VALUES.length),
  features: z.array(z.string().trim().min(1).max(120, "Fitur maksimal 120 karakter.")).max(20, "Maksimal 20 fitur."),
  isFeatured: checkbox,
  isPublished: checkbox,
})
  .superRefine((data, ctx) => {
    if (data.tags.includes("promo") && data.originalPrice !== undefined && data.originalPrice <= data.price) {
      ctx.addIssue({
        code: "custom",
        path: ["originalPrice"],
        message: "Harga sebelum diskon harus lebih besar dari harga promo.",
      });
    }
  });

export type TemplateInput = z.infer<typeof templateSchema>;

export const categorySchema = z.object({
  name: requiredText(60, "Nama kategori"),
  slug,
  description: text(300, "Deskripsi"),
  image: optionalImageUrl,
  isActive: checkbox,
});

export type CategoryInput = z.infer<typeof categorySchema>;

/** Query katalog publik dari searchParams (selalu aman dipakai, tidak pernah throw). */
export const CATALOG_SORTS = ["recommended", "newest", "price-asc", "price-desc"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export type CatalogQuery = {
  q: string;
  category: string;
  sort: CatalogSort;
  tag: TemplateTag | "";
  page: number;
};

export function parseCatalogQuery(params: Record<string, string | string[] | undefined>): CatalogQuery {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const sort = first(params.sort) as CatalogSort;
  const page = Number.parseInt(first(params.page), 10);
  const tag = first(params.tag).trim().toLowerCase();
  return {
    q: first(params.q).trim().slice(0, 80),
    category: first(params.category).trim().toLowerCase().slice(0, 80),
    sort: CATALOG_SORTS.includes(sort) ? sort : "recommended",
    tag: isTemplateTag(tag) ? tag : "",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 500) : 1,
  };
}
