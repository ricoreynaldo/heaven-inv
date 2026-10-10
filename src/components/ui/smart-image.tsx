import Image, { type ImageProps } from "next/image";

/**
 * next/image yang aman untuk URL dari CMS: path lokal & Vercel Blob dioptimasi,
 * host lain (URL yang ditempel admin) ditampilkan apa adanya.
 */
export function isOptimizableSrc(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    return new URL(src).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function SmartImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  return <Image src={src} alt={alt} unoptimized={!isOptimizableSrc(src)} {...props} />;
}
