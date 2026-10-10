import Link from "next/link";
import { TextLink } from "@/components/site/text-link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="max-w-3xl text-center">
        <h1 className="title-caps text-2xl text-ink md:text-[2rem]">Halaman tidak ditemukan</h1>
        <p className="meta-caps mt-4 text-ink-muted">Error 404</p>
        <p className="mx-auto mt-8 max-w-sm text-sm text-ink-soft">
          Tautan mungkin sudah berubah, atau undangan yang kamu cari sedang tidak ditampilkan.
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-4">
          <TextLink href="/catalog">Buka katalog</TextLink>
          <TextLink href="/">Ke beranda</TextLink>
        </div>
        <p className="mt-10 text-sm text-ink-muted">
          Butuh bantuan?{" "}
          <Link href="/#cara-pesan" className="text-ink underline decoration-accent underline-offset-4 hover:decoration-ink">
            Lihat cara memesan
          </Link>
        </p>
      </div>
    </main>
  );
}
