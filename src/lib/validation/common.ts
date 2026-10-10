import { z } from "zod";

/** Path internal yang aman: diawali satu "/", tanpa "..", tanpa backslash. */
function isSafePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("..") && !value.includes("\\");
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Gambar: path lokal ("/seed/..", "/media/..") atau URL http(s). */
export const imageUrl = z
  .string()
  .trim()
  .min(1, "Gambar wajib diunggah.")
  .max(2048, "URL gambar terlalu panjang.")
  .refine((value) => isSafePath(value) || isHttpUrl(value), "Gunakan gambar hasil unggah atau URL https yang valid.");

export const optionalImageUrl = z.union([z.literal(""), imageUrl]);

/** Link tombol: path internal, anchor (#...), atau URL http(s). */
export const linkHref = z
  .string()
  .trim()
  .min(1, "Link wajib diisi.")
  .max(2048)
  .refine(
    (value) => isSafePath(value) || /^#[\w-]+$/.test(value) || isHttpUrl(value),
    "Gunakan path internal (mis. /catalog), anchor (#cara-pesan), atau URL https.",
  );

/** Demo URL template: kosong, path internal, atau URL http(s). */
export const demoUrl = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .max(2048)
    .refine((value) => isSafePath(value) || isHttpUrl(value), "Demo harus berupa URL https atau path internal (mis. /demo/elegant-rose)."),
]);

export const text = (max: number, label = "Teks") =>
  z.string().trim().max(max, `${label} maksimal ${max} karakter.`);

export const requiredText = (max: number, label: string) =>
  z.string().trim().min(1, `${label} wajib diisi.`).max(max, `${label} maksimal ${max} karakter.`);

export const optionalEmail = z.union([z.literal(""), z.string().trim().email("Format email tidak valid.").max(160)]);

export type FieldErrors = Record<string, string>;

/** zod issues → { "items.0.title": "pesan" } untuk ditampilkan di dekat field. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };
