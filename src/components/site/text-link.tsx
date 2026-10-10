import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Link teks kecil kapital berspasi lebar dengan garis tipis di bawahnya
 * (thesis v5): pengganti tombol di beranda. Garis menebal ke tinta saat hover.
 */
export function TextLink({
  href,
  children,
  external = false,
  className,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const classes = cn(
    "meta-caps inline-flex items-center gap-2 border-b border-ink/25 pb-1 text-ink transition-colors duration-200 hover:border-ink",
    className,
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
