import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

/**
 * Brand: logo opsional dari Pengaturan (ikon persegi) di kiri nama brand.
 * Logo berukuran 1.75em, jadi selalu selaras dengan besar teks di sampingnya.
 *   caps:     nama kapital berspasi lebar (situs publik, thesis v5)
 *   wordmark: Plus Jakarta Sans, kata terakhir berbobot regular (admin)
 * `tone="light"` untuk di atas latar gelap (menu terbuka): teks & logo jadi putih.
 */
export function BrandMark({
  brandName,
  logo,
  className,
  tone = "dark",
  variant = "wordmark",
}: {
  brandName: string;
  logo?: string;
  className?: string;
  tone?: "dark" | "light";
  variant?: "wordmark" | "caps";
}) {
  const words = brandName.trim().split(/\s+/);
  const last = variant === "wordmark" && words.length > 1 ? words.pop() : null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.6em] leading-none",
        variant === "caps" ? "font-sans font-semibold uppercase tracking-[0.2em]" : "font-display text-[1.35rem] tracking-[-0.04em]",
        tone === "dark" ? "text-ink" : "text-surface",
        className,
      )}
    >
      {logo ? (
        <span className="relative block size-[1.75em] shrink-0">
          <SmartImage
            src={logo}
            alt=""
            fill
            sizes="64px"
            className={cn("object-contain transition-[filter] duration-200", tone === "light" && "brightness-0 invert")}
          />
        </span>
      ) : null}
      <span>
        {words.join(" ")}
        {last ? <span className="font-normal"> {last}</span> : null}
      </span>
    </span>
  );
}
