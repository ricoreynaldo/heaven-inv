/**
 * Tag katalog yang bisa dicentang admin per template (boleh lebih dari satu).
 * Daftar tetap supaya filter katalog & tampilan kartu konsisten.
 */
export const TEMPLATE_TAGS = [
  { value: "best-seller", label: "Best Seller" },
  { value: "new", label: "New" },
  { value: "promo", label: "Promo" },
  { value: "premium", label: "Premium" },
] as const;

export type TemplateTag = (typeof TEMPLATE_TAGS)[number]["value"];

export const TAG_VALUES = TEMPLATE_TAGS.map((tag) => tag.value) as [TemplateTag, ...TemplateTag[]];

export function isTemplateTag(value: string): value is TemplateTag {
  return (TAG_VALUES as string[]).includes(value);
}

export function tagLabel(value: TemplateTag): string {
  return TEMPLATE_TAGS.find((tag) => tag.value === value)?.label ?? value;
}

/** Urutan tampil tetap (Best Seller selalu pertama), duplikat dibuang. */
export function sortTags(tags: readonly string[]): TemplateTag[] {
  return TAG_VALUES.filter((value) => tags.includes(value));
}
