/**
 * URL publik situs, tanpa garis miring di akhir.
 * Urutan: SITE_URL → domain produksi Vercel → localhost.
 */
export function siteUrl(): string {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3060";
}

/** Path relatif ("/demo/x") → URL absolut. URL absolut dikembalikan apa adanya. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl()}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}
