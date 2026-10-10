import type { ReactNode } from "react";
import { SplitTitle } from "@/components/motion/split-title";
import { cn } from "@/lib/utils";

/** Label kecil uppercase di atas judul (dipakai halaman detail & demo). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("label-caps text-accent-deep", className)}>{children}</p>;
}

/**
 * Kepala section lookbook (thesis v5): judul kapital berspasi lebar di tengah,
 * keterangan abu-abu kecil kapital di bawahnya. Tanpa label di atas judul.
 */
export function SectionHeading({
  id,
  title,
  subtitle,
  className,
}: {
  id?: string;
  title: string;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex max-w-3xl flex-col items-center text-center", className)}>
      <SplitTitle id={id} className="title-caps text-[1.25rem] text-ink md:text-[1.625rem]">
        {title}
      </SplitTitle>
      {subtitle ? <p className="meta-caps mt-4 max-w-md text-ink-muted">{subtitle}</p> : null}
    </div>
  );
}
