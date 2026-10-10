import type { TemplateTag } from "@/lib/tags";

/**
 * Harga coret yang boleh tampil: hanya saat tag Promo terpasang dan harga
 * sebelum diskon memang lebih tinggi dari harga sekarang. Selain itu null.
 */
export function visibleOriginalPrice(template: { price: number; originalPrice?: number | null; tags: readonly TemplateTag[] }) {
  const original = template.originalPrice ?? null;
  return template.tags.includes("promo") && original !== null && original > template.price ? original : null;
}

/** Persentase hemat, dibulatkan ke bawah (mis. 129000 → 99000 = 23%). */
export function discountPercent(price: number, originalPrice: number): number {
  return Math.floor(((originalPrice - price) / originalPrice) * 100);
}
