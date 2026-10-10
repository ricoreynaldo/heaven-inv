import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSeedDatabase } from "@/lib/store/seed";
import type { Database } from "@/lib/store/types";

/**
 * Database dummy berbasis satu file JSON (default `.data/db.json`).
 *
 * Sementara backend belum disiapkan, seluruh query publik & admin membaca dan
 * menulis lewat modul ini. Perubahan dari panel admin bertahan setelah server
 * di-restart. Hapus file tersebut untuk kembali ke data awal (seed).
 *
 * Penulisan diserialkan (satu antrean per proses) dan atomik (tulis ke file
 * sementara lalu rename), jadi aman untuk klik beruntun di admin. Bila disk
 * read-only (mis. serverless), data tetap jalan di memori proses.
 */

export type { Database } from "@/lib/store/types";

const globalStore = globalThis as unknown as {
  __heavenDb?: Database;
  __heavenDbQueue?: Promise<unknown>;
  __heavenDbReadonly?: boolean;
  __heavenDbSeeding?: Promise<Database>;
};

function dbPath(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.DUMMY_DB_PATH ?? ".data/db.json");
}

async function persist(db: Database): Promise<void> {
  if (globalStore.__heavenDbReadonly) return;
  const target = dbPath();
  try {
    await mkdir(path.dirname(target), { recursive: true });
    const temp = `${target}.${process.pid}.tmp`;
    await writeFile(temp, JSON.stringify(db, null, 2), "utf8");
    await rename(temp, target);
  } catch (error) {
    globalStore.__heavenDbReadonly = true;
    console.warn("[store] Tidak bisa menulis database dummy ke disk, memakai memori saja.", error);
  }
}

async function load(): Promise<Database> {
  try {
    const raw = await readFile(dbPath(), "utf8");
    const parsed = JSON.parse(raw) as Database;
    if (parsed?.version === 1 && Array.isArray(parsed.templates)) return parsed;
    console.warn("[store] Format database dummy tidak dikenal, membuat ulang dari seed.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[store] Gagal membaca database dummy, membuat ulang dari seed.", error);
    }
  }
  // Permintaan paralel pertama kali berbagi satu seed (ID tetap konsisten).
  globalStore.__heavenDbSeeding ??= (async () => {
    const seeded = createSeedDatabase();
    await persist(seeded);
    return seeded;
  })().finally(() => {
    globalStore.__heavenDbSeeding = undefined;
  });
  return globalStore.__heavenDbSeeding;
}

/**
 * Snapshot terbaru. Di memori proses disimpan salinan terakhir; file dibaca
 * ulang setiap kali supaya perubahan dari worker lain (build/dev) ikut terbaca.
 */
export async function readDb(): Promise<Database> {
  if (globalStore.__heavenDbReadonly && globalStore.__heavenDb) return globalStore.__heavenDb;
  const db = await load();
  globalStore.__heavenDb = db;
  return db;
}

/** Jalankan mutasi secara berurutan, lalu simpan. Nilai kembalian fn diteruskan. */
export function mutateDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const db = structuredClone(await readDb());
    const result = await fn(db);
    globalStore.__heavenDb = db;
    await persist(db);
    return result;
  };
  const queued = (globalStore.__heavenDbQueue ?? Promise.resolve()).then(run, run);
  globalStore.__heavenDbQueue = queued.catch(() => undefined);
  return queued;
}

export function nowIso(): string {
  return new Date().toISOString();
}
