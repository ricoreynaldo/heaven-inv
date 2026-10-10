import type { ReactNode } from "react";
import { tagLabel, type TemplateTag } from "@/lib/tags";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "ink" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-soft ring-line",
  accent: "bg-accent-soft text-ink ring-accent/40",
  ink: "bg-ink text-surface ring-ink",
  success: "bg-success-soft text-success ring-success/20",
  warning: "bg-warning-soft text-warning ring-warning/20",
  danger: "bg-danger-soft text-danger ring-danger/20",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-control px-2 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Tag katalog: label kotak kecil kapital berspasi lebar (thesis v5). Best Seller
 * terisi tinta; lainnya putih bergaris tinta, terbaca di atas gambar apa pun.
 */
export function TemplateTagPill({ tag, className }: { tag: TemplateTag; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center whitespace-nowrap px-1.5 font-sans text-[0.625rem] font-semibold uppercase leading-none tracking-[0.14em]",
        tag === "best-seller" ? "bg-ink text-surface" : "bg-surface text-ink ring-1 ring-inset ring-ink",
        className,
      )}
    >
      {tagLabel(tag)}
    </span>
  );
}
