import { readLocalMedia } from "@/lib/storage";

/**
 * Menyajikan media yang disimpan oleh driver storage "local".
 * Nama file berupa UUID dan tidak pernah ditimpa, jadi aman di-cache selamanya.
 */
export async function GET(_request: Request, { params }: RouteContext<"/media/[...key]">) {
  const { key } = await params;
  const media = await readLocalMedia(key.join("/"));
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(media.body), {
    headers: {
      "Content-Type": media.contentType,
      "Content-Length": String(media.body.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
