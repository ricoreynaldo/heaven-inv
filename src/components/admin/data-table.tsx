import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Sembunyikan header secara visual (tetap terbaca screen reader). */
  srOnlyHeader?: boolean;
};

/**
 * Tabel admin. Desktop: <table> biasa. Ponsel: tiap baris jadi kartu lewat
 * `renderMobile`, supaya tidak ada scroll horizontal.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  renderMobile,
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  renderMobile: (row: T) => ReactNode;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-card bg-surface ring-1 ring-line lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="meta-caps border-b border-line bg-canvas text-ink-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn("px-3 py-3.5 font-medium first:pl-5 last:pr-5", column.className)}>
                  {column.srOnlyHeader ? <span className="sr-only">{column.header}</span> : column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="transition-colors hover:bg-canvas">
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-3 py-3 align-middle first:pl-5 last:pr-5", column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 lg:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={rowKey(row)} className="rounded-card bg-surface p-4 ring-1 ring-line">
            {renderMobile(row)}
          </li>
        ))}
      </ul>
    </>
  );
}
