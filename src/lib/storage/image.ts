import "server-only";
import sharp from "sharp";

/**
 * Validasi & normalisasi gambar unggahan.
 * Tipe ditentukan dari magic bytes (bukan ekstensi/MIME dari browser), lalu
 * gambar di-decode ulang oleh sharp: metadata EXIF hilang, orientasi diperbaiki,
 * ukuran dibatasi, dan hasilnya selalu WebP. SVG sengaja tidak diterima
 * (bisa membawa script).
 */

export type UploadPurpose = "image" | "favicon";

export type ProcessedImage = { body: Buffer; ext: string; contentType: string; width: number; height: number };

type Detected = "jpeg" | "png" | "webp" | "avif" | "ico";

export function detectImageType(buf: Buffer): Detected | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "avif";
  }
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) return "ico";
  return null;
}

export function maxUploadMb(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? 4);
  return Number.isFinite(mb) && mb > 0 ? Math.min(mb, 20) : 4;
}

export async function processImage(
  buf: Buffer,
  purpose: UploadPurpose,
): Promise<ProcessedImage | { error: string }> {
  if (buf.length === 0) return { error: "File kosong." };
  if (buf.length > maxUploadMb() * 1024 * 1024) return { error: `Ukuran file maksimal ${maxUploadMb()} MB.` };

  const type = detectImageType(buf);
  if (!type) return { error: "Format tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF." };

  if (type === "ico") {
    if (purpose !== "favicon") return { error: "File .ico hanya untuk favicon." };
    return { body: buf, ext: "ico", contentType: "image/x-icon", width: 0, height: 0 };
  }

  try {
    const pipeline = sharp(buf, { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
    const meta = await pipeline.metadata();
    if (!meta.width || !meta.height) return { error: "Gambar tidak bisa dibaca." };

    if (purpose === "favicon") {
      const { data, info } = await pipeline
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer({ resolveWithObject: true });
      return { body: data, ext: "png", contentType: "image/png", width: info.width, height: info.height };
    }

    const { data, info } = await pipeline
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer({ resolveWithObject: true });
    return { body: data, ext: "webp", contentType: "image/webp", width: info.width, height: info.height };
  } catch {
    return { error: "Gambar rusak atau tidak bisa diproses." };
  }
}
