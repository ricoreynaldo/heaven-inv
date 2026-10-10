import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

/**
 * Abstraksi storage media. Driver bisa diganti lewat env tanpa menyentuh
 * kode pemanggil:
 *
 *   local        → file di disk (STORAGE_LOCAL_DIR), disajikan oleh /media/[...key].
 *                  Cocok untuk VPS/server dengan disk permanen.
 *   vercel-blob  → Vercel Blob (public). Wajib di Vercel/serverless karena
 *                  filesystem di sana tidak permanen.
 *
 * Nilai yang disimpan ke database adalah URL publik hasil put() — "/media/..."
 * untuk local, URL https lengkap untuk blob.
 */

export interface StorageDriver {
  readonly name: "local" | "vercel-blob";
  put(key: string, body: Buffer, contentType: string): Promise<string>;
  remove(url: string): Promise<void>;
  /** true bila URL ini dikelola oleh driver (aman untuk dihapus). */
  owns(url: string): boolean;
}

export const LOCAL_MEDIA_PREFIX = "/media/";

export function localStorageDir(): string {
  // Path ditentukan saat runtime (env), jangan di-trace bundler.
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.STORAGE_LOCAL_DIR ?? "./storage/uploads");
}

/** Path absolut di dalam folder storage, atau null bila key mencoba keluar folder. */
export function resolveLocalPath(key: string): string | null {
  const root = localStorageDir();
  const target = path.resolve(/*turbopackIgnore: true*/ root, key);
  const rel = path.relative(root, target);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return target;
}

const localDriver: StorageDriver = {
  name: "local",
  async put(key, body) {
    const target = resolveLocalPath(key);
    if (!target) throw new Error("Key storage tidak valid.");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    return `${LOCAL_MEDIA_PREFIX}${key}`;
  },
  async remove(url) {
    if (!url.startsWith(LOCAL_MEDIA_PREFIX)) return;
    const target = resolveLocalPath(url.slice(LOCAL_MEDIA_PREFIX.length));
    if (!target) return;
    try {
      await unlink(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  },
  owns(url) {
    return url.startsWith(LOCAL_MEDIA_PREFIX);
  },
};

const blobDriver: StorageDriver = {
  name: "vercel-blob",
  async put(key, body, contentType) {
    const blob = await put(`heaven-inv/${key}`, body, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return blob.url;
  },
  async remove(url) {
    await del(url);
  },
  owns(url) {
    try {
      return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
    } catch {
      return false;
    }
  },
};

export function getStorage(): StorageDriver {
  const configured = process.env.STORAGE_DRIVER?.trim();
  if (configured === "vercel-blob") return blobDriver;
  if (configured === "local") return localDriver;
  return process.env.BLOB_READ_WRITE_TOKEN ? blobDriver : localDriver;
}

/** Pesan error yang jelas bila driver local dipakai di lingkungan serverless. */
export function storageMisconfiguration(): string | null {
  const storage = getStorage();
  if (storage.name === "local" && process.env.VERCEL) {
    return "Storage lokal tidak permanen di Vercel. Hubungkan Vercel Blob (BLOB_READ_WRITE_TOKEN) atau set STORAGE_DRIVER=vercel-blob.";
  }
  if (storage.name === "vercel-blob" && !process.env.BLOB_READ_WRITE_TOKEN) {
    return "BLOB_READ_WRITE_TOKEN belum diset untuk driver vercel-blob.";
  }
  return null;
}

export function newObjectKey(ext: string): string {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}/${month}/${randomUUID()}.${ext}`;
}

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

export async function readLocalMedia(key: string): Promise<{ body: Buffer; contentType: string } | null> {
  const target = resolveLocalPath(key);
  if (!target) return null;
  const contentType = CONTENT_TYPES[path.extname(target).toLowerCase()];
  if (!contentType) return null;
  try {
    return { body: await readFile(/*turbopackIgnore: true*/ target), contentType };
  } catch {
    return null;
  }
}
