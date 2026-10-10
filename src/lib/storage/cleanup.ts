import "server-only";
import { readDb } from "@/lib/store";
import { getStorage } from "@/lib/storage";

/**
 * Hapus file media yang tidak lagi dirujuk di mana pun.
 * Best-effort: tidak pernah melempar error ke pemanggil. Gambar seed di
 * /public tidak pernah disentuh karena bukan milik driver storage.
 */
export async function cleanupUnusedMedia(candidates: (string | null | undefined)[]): Promise<void> {
  const storage = getStorage();
  const urls = [...new Set(candidates.filter((url): url is string => !!url && storage.owns(url)))];
  if (urls.length === 0) return;
  const db = await readDb();
  for (const url of urls) {
    try {
      const used =
        db.templates.some((template) => template.thumbnail === url || template.images.some((image) => image.url === url)) ||
        db.categories.some((category) => category.image === url) ||
        db.content.some((row) => row.value.includes(url)) ||
        db.settings.some((row) => row.value === url);
      if (!used) await storage.remove(url);
    } catch (error) {
      console.error("[media:cleanup]", url, error);
    }
  }
}
