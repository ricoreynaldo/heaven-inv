import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "light" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

/* Lima state (MASTER.md): default · hover · focus-visible (global outline) · active scale · disabled. */
const base =
  "group/button relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium " +
  "transition-[background-color,color,box-shadow,transform,opacity] duration-200 ease-out active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-surface hover:bg-ink/88",
  secondary: "bg-surface text-ink ring-1 ring-inset ring-line-strong hover:ring-accent hover:bg-canvas",
  /* Situs publik (v4): garis tinta, terisi tinta saat hover. */
  outline: "bg-transparent text-ink ring-1 ring-inset ring-ink hover:bg-ink hover:text-surface",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
  light: "bg-surface text-ink hover:bg-canvas",
  danger: "bg-danger text-surface hover:bg-danger/90",
  link: "rounded-md px-0 text-ink underline decoration-accent decoration-1 underline-offset-4 hover:decoration-ink active:scale-100",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-12 px-6 text-[0.9375rem]",
  icon: "size-11",
  "icon-sm": "size-9",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], variant === "link" ? "h-auto" : sizes[size], className);
}

/** Ikon panah yang bergeser saat hover tombol induknya. */
export function ButtonArrow({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-grid transition-transform duration-200 ease-out group-hover/button:translate-x-0.5 group-hover/button:-translate-y-px"
    >
      {children}
    </span>
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({ variant, size, loading, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  external?: boolean;
};

export function ButtonLink({ variant, size, className, external, children, ...props }: ButtonLinkProps) {
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Link className={buttonClasses({ variant, size, className })} {...externalProps} {...props}>
      {children}
    </Link>
  );
}
