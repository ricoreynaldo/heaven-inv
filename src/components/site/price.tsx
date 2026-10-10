import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Harga + harga coret (bila promo). Teks sr-only membuat pembaca layar
 * menyebut "Harga" dan "Harga normal", karena <s> sering tidak diumumkan.
 */
export function Price({
  price,
  originalPrice,
  className,
  priceClassName = "font-medium text-ink",
  originalClassName = "text-[0.85em] text-ink-muted",
}: {
  price: number;
  originalPrice: number | null;
  className?: string;
  priceClassName?: string;
  originalClassName?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      <span className={cn("tabular", priceClassName)}>
        <span className="sr-only">Harga: </span>
        {formatRupiah(price)}
      </span>
      {originalPrice ? (
        <s className={cn("tabular decoration-1", originalClassName)}>
          <span className="sr-only">Harga normal: </span>
          {formatRupiah(originalPrice)}
        </s>
      ) : null}
    </span>
  );
}
