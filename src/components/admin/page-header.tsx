import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div>
        {back ? <div className="mb-3">{back}</div> : null}
        <h1 className="title-caps text-xl text-ink md:text-2xl">{title}</h1>
        {description ? <p className="meta-caps mt-3 max-w-2xl text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Panel putih dengan judul untuk mengelompokkan field/form di admin. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card bg-surface ring-1 ring-line", className)}>
      {title ? (
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            <h2 className="title-caps text-[0.8125rem] text-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
