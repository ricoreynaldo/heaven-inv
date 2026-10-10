import type { MetadataRoute } from "next";
import { getPublishedSlugs } from "@/lib/data/public";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const templates = await getPublishedSlugs();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalog`, changeFrequency: "daily", priority: 0.9 },
    ...templates.map((template) => ({
      url: `${base}/catalog/${template.slug}`,
      lastModified: template.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
