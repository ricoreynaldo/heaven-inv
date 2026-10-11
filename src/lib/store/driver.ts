export type StoreDriver = "postgres" | "json";

/**
 * Pilih sumber data:
 *   DATA_STORE=postgres → Postgres (Neon) lewat DATABASE_URL
 *   DATA_STORE=dummy    → database dummy JSON (.data/db.json)
 *   kosong              → Postgres bila berjalan di Vercel dan DATABASE_URL ada,
 *                         selain itu dummy. Jadi di laptop tetap dummy walau .env
 *                         berisi DATABASE_URL, dan di Vercel otomatis memakai Neon.
 */
export function resolveStoreDriver(env: Record<string, string | undefined> = process.env): StoreDriver {
  const choice = env.DATA_STORE?.trim().toLowerCase();
  if (choice === "postgres") {
    if (!env.DATABASE_URL) throw new Error("DATA_STORE=postgres tetapi DATABASE_URL belum diset.");
    return "postgres";
  }
  if (choice === "dummy" || choice === "json") return "json";
  return env.VERCEL && env.DATABASE_URL ? "postgres" : "json";
}
