/** Tag cache bersama untuk `cacheTag` (baca) dan `revalidateTag` (setelah mutasi admin). */
export const TAGS = {
  settings: "settings",
  content: "content",
  categories: "categories",
  templates: "templates",
} as const;

export const templateTag = (slug: string) => `template:${slug}`;
