"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react/ssr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTabIndicator } from "@/components/motion/tab-indicator";
import { Select } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Counts = { all: number; published: number; draft: number; bestSeller: number; featured: number };

/** Tab = satu "tampilan" daftar. Masing-masing memetakan ke parameter URL. */
const VIEWS = [
  { key: "all", label: "Semua", params: {}, count: "all" },
  { key: "published", label: "Tampil di situs", params: { status: "published" }, count: "published" },
  { key: "draft", label: "Draft", params: { status: "draft" }, count: "draft" },
  { key: "best-seller", label: "Best Seller", params: { tag: "best-seller" }, count: "bestSeller" },
  { key: "featured", label: "Di beranda", params: { status: "featured" }, count: "featured" },
] as const;

/**
 * Filter daftar undangan di admin: tab tampilan (dengan jumlah), pencarian
 * yang langsung berjalan saat mengetik, dan pilihan kategori. Tanpa tombol
 * "Terapkan": setiap perubahan langsung memperbarui daftar.
 */
export function TemplateFilters({ counts, categories }: { counts: Counts; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const currentQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(currentQ);
  const inputRef = useRef<HTMLInputElement>(null);

  const status = searchParams.get("status") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const category = searchParams.get("category") ?? "";
  const activeView = tag === "best-seller" ? "best-seller" : status || "all";
  const tabsRef = useRef<HTMLDivElement>(null);
  useTabIndicator(tabsRef, activeView);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) setQ(currentQ);
  }, [currentQ]);

  function go(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  useEffect(() => {
    if (q.trim() === currentQ) return;
    const timer = setTimeout(() => go({ q: q.trim() || null }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- go memakai searchParams terbaru
  }, [q]);

  return (
    <div className="mb-6 space-y-3">
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Tampilan daftar"
        className="group/tabs no-scrollbar relative -mx-4 flex gap-5 overflow-x-auto border-b border-line px-4 md:mx-0 md:gap-6 md:px-0"
      >
        <span data-tab-indicator="" aria-hidden="true" className="invisible absolute bottom-0 left-0 h-px w-0 bg-ink" />
        {VIEWS.map((view) => {
          const selected = view.key === activeView;
          return (
            <button
              key={view.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => go({ status: null, tag: null, ...view.params })}
              className={cn(
                "meta-caps relative z-10 inline-flex h-11 shrink-0 items-center gap-2 border-b border-transparent transition-colors duration-200 group-data-[ready]/tabs:border-transparent",
                selected ? "border-ink text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {view.label}
              <span className={cn("tabular", selected ? "text-ink-muted" : "text-ink-muted/70")}>{counts[view.count]}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_13rem]">
        <div className="relative">
          <label htmlFor="admin-template-q" className="sr-only">
            Cari undangan
          </label>
          <MagnifyingGlassIcon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            id="admin-template-q"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Cari nama undangan"
            autoComplete="off"
            className="h-11 w-full rounded-inner border border-line-strong bg-surface pl-11 pr-10 text-[0.9375rem] text-ink placeholder:text-ink-muted transition-[border-color,box-shadow] duration-200 hover:border-ink-muted focus:border-ink focus:outline-none focus:ring-4 focus:ring-accent/30 [&::-webkit-search-cancel-button]:hidden"
          />
          {pending ? (
            <Spinner className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink" label="Memuat" />
          ) : q ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                go({ q: null });
              }}
              aria-label="Hapus pencarian"
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-control text-ink-muted hover:bg-canvas hover:text-ink"
            >
              <XIcon size={14} />
            </button>
          ) : null}
        </div>
        <div>
          <label htmlFor="admin-template-category" className="sr-only">
            Kategori
          </label>
          <Select id="admin-template-category" value={category} onChange={(event) => go({ category: event.target.value || null })}>
            <option value="">Semua kategori</option>
            {categories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
