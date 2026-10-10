import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { getStorage, newObjectKey, storageMisconfiguration } from "@/lib/storage";
import { maxUploadMb, processImage, type UploadPurpose } from "@/lib/storage/image";

/**
 * Upload gambar admin. Selalu memverifikasi sesi di sini (proxy.ts hanya
 * pemeriksaan awal), membatasi ukuran & frekuensi, lalu menormalisasi gambar.
 */
export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Sesi berakhir. Silakan masuk kembali." }, { status: 401 });

  const limited = await rateLimit(`upload:${admin.id}`, LIMITS.upload.limit, LIMITS.upload.windowMs);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak unggahan. Tunggu sebentar lalu coba lagi." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const misconfigured = storageMisconfiguration();
  if (misconfigured) return NextResponse.json({ error: misconfigured }, { status: 500 });

  // Tolak lebih awal sebelum membaca body yang terlalu besar.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > (maxUploadMb() + 1) * 1024 * 1024) {
    return NextResponse.json({ error: `Ukuran file maksimal ${maxUploadMb()} MB.` }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Data unggahan tidak valid." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Pilih file gambar terlebih dahulu." }, { status: 400 });
  const purpose: UploadPurpose = form.get("purpose") === "favicon" ? "favicon" : "image";

  const processed = await processImage(Buffer.from(await file.arrayBuffer()), purpose);
  if ("error" in processed) return NextResponse.json({ error: processed.error }, { status: 422 });

  try {
    const url = await getStorage().put(newObjectKey(processed.ext), processed.body, processed.contentType);
    return NextResponse.json({ url, width: processed.width, height: processed.height });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json({ error: "Gagal menyimpan file. Coba lagi sebentar." }, { status: 500 });
  }
}
