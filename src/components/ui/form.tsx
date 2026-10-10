import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-inner border border-line-strong bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-ink-muted " +
  "transition-[border-color,box-shadow] duration-200 ease-out " +
  "hover:border-ink-muted focus:border-ink focus:outline-none focus:ring-4 focus:ring-accent/30 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus:ring-danger/15";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(control, "h-11 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      >
        <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Label di atas, helper text, dan pesan error tepat di bawah field. */
export function FormField({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Props aksesibilitas untuk control di dalam FormField. */
export function fieldProps(id: string, error?: string, hint?: boolean) {
  return {
    id,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
}

/** Toggle bergaya switch di atas checkbox native (tetap bekerja tanpa JS). */
export function Switch({
  label,
  description,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4", className)}>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description ? <span className="text-sm text-ink-muted">{description}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span
          aria-hidden="true"
          className="h-7 w-12 rounded-full bg-line-strong transition-colors duration-200 ease-out peer-checked:bg-ink peer-focus-visible:ring-4 peer-focus-visible:ring-accent/40 peer-disabled:opacity-50"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1 top-1 size-5 rounded-full bg-surface transition-transform duration-200 ease-out peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}
