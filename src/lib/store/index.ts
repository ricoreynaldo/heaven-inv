import "server-only";
import { resolveStoreDriver } from "@/lib/store/driver";
import { mutateJsonDb, readJsonDb } from "@/lib/store/json";
import { mutatePostgresDb, readPostgresDb } from "@/lib/store/postgres";
import type { Database } from "@/lib/store/types";

/**
 * Pintu tunggal data aplikasi. Query publik/admin dan server action hanya
 * memakai readDb/mutateDb; driver dipilih lewat env (lib/store/driver.ts):
 * Postgres (Neon) di Vercel, database dummy JSON di laptop.
 */

export type { Database } from "@/lib/store/types";
export { resolveStoreDriver } from "@/lib/store/driver";

/** Snapshot data terbaru. */
export function readDb(): Promise<Database> {
  return resolveStoreDriver() === "postgres" ? readPostgresDb() : readJsonDb();
}

/** Jalankan mutasi secara berurutan, lalu simpan. Nilai kembalian fn diteruskan. */
export function mutateDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  return resolveStoreDriver() === "postgres" ? mutatePostgresDb(fn) : mutateJsonDb(fn);
}

export function nowIso(): string {
  return new Date().toISOString();
}
