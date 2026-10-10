"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page grid min-h-[70dvh] place-items-center pb-20 pt-32">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-ink">Ada yang tidak beres</h1>
        <p className="mt-3 text-ink-soft">
          Halaman ini gagal dimuat. Coba muat ulang; bila masih terjadi, hubungi kami lewat WhatsApp.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>Coba lagi</Button>
          <ButtonLink href="/" variant="outline">
            Ke Beranda
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
