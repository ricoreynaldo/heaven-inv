import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed border-line-strong bg-surface px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 grid size-12 place-items-center rounded-control bg-accent-soft text-ink">{icon}</div>
      ) : null}
      <h3 className="title-caps text-sm text-ink">{title}</h3>
      {description ? <p className="mt-3 max-w-md text-sm text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
