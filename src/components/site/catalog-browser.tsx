"use client";

import { FadersHorizontalIcon, XIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useTransition, type ReactNode } from "react";
import { captureCatalogLayout } from "@/components/motion/flip-grid";
import { FilterDrawer, SORT_OPTIONS } from "@/components/site/filter-drawer";
import { Spinner } from "@/components/ui/spinner";
import { isTemplateTag, tagLabel } from "@/lib/tags";
import { cn } from "@/lib/utils";

type CategoryOption = { slug: string; name: string; templateCount: number };

/** Urutan sebagai teks di satu baris (desktop), seperti "Sort by | Price | Rating". */
const SORT_SHORT: Record<string, string> = {
  recommended: "Rekomendasi",
  newest: "Terbaru",
  "price-asc": "Harga ↑",
  "price-desc": "Harga ↓",
};

/**
 * Kepala katalog minimalis (thesis v3): breadcrumb + urutan teks, judul kecil
 * tebal + chip filter yang bisa dihapus, tombol "Filter By" yang membuka panel
 * dari kanan. Semua state di URL; sebelum navigasi posisi kartu direkam untuk
 * Flip. Pencarian teks datang dari header (parameter q) dan tampil sebagai chip.
 */
export function CatalogBrowser({ categories, children }: { categories: CategoryOption[]; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "recommended";
  const rawTag = searchParams.get("tag") ?? "";
  const tag = isTemplateTag(rawTag) ? rawTag : "";

  const go = useCallback(
    (href: string) => {
      captureCatalogLayout();
      startTransition(() => router.replace(href, { scroll: false }));
    },
    [router],
  );

  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      if (!("page" in updates)) params.delete("page");
      if (params.get("sort") === "recommended") params.delete("sort");
      const query = params.toString();
      go(query ? `${pathname}?${query}` : pathname);
    },
    [go, pathname, searchParams],
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    filterButtonRef.current?.focus({ preventScroll: true });
  }, []);

  const categoryName = categories.find((option) => option.slug === category)?.name;
  const title = categoryName ?? (tag ? tagLabel(tag) : "Semua undangan");
  const chips = [
    categoryName ? { key: "category", label: categoryName } : null,
    tag && categoryName ? { key: "tag", label: tagLabel(tag) } : null,
    q ? { key: "q", label: `“${q}”` } : null,
  ].filter((chip): chip is { key: string; label: string } => chip !== null);
  const hasFilters = Boolean(q || category || tag || sort !== "recommended");

  return (
    <div>
      {/* Baris 1: breadcrumb + urutan */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-ink-muted">
            <li>
              <Link href="/" className="hover:text-ink">
                Beranda
              </Link>
            </li>
            <li aria-hidden="true" className="h-px w-4 bg-line-strong" />
            <li>
              {hasFilters ? (
                <Link
                  href="/catalog"
                  className="hover:text-ink"
                  onClick={(event) => {
                    event.preventDefault();
                    go(pathname);
                  }}
                >
                  Katalog
                </Link>
              ) : (
                <span aria-current="page" className="text-ink">
                  Katalog
                </span>
              )}
            </li>
            {categoryName ? (
              <>
                <li aria-hidden="true" className="h-px w-4 bg-line-strong" />
                <li aria-current="page" className="text-ink">
                  {categoryName}
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        <div role="group" aria-label="Urutkan" className="hidden items-center gap-3 md:flex">
          <span className="text-ink">Urutkan</span>
          {SORT_OPTIONS.map((option) => (
            <span key={option.value} className="flex items-center gap-3">
              <span aria-hidden="true" className="h-3 w-px bg-line-strong" />
              <button
                type="button"
                aria-pressed={sort === option.value}
                onClick={() => navigate({ sort: option.value })}
                className={cn(
                  "transition-colors duration-200",
                  sort === option.value ? "font-medium text-accent-deep" : "text-ink-soft hover:text-ink",
                )}
              >
                {SORT_SHORT[option.value]}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Baris 2: judul + chip filter + Filter By */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 md:mt-16">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-3">
          <h1 className="title-caps text-xl text-ink sm:text-2xl">{title}</h1>
          {chips.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft" aria-label="Filter aktif">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={() => navigate({ [chip.key]: null })}
                    aria-label={`Hapus filter ${chip.label}`}
                    className="group inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-ink"
                  >
                    <XIcon size={10} className="transition-transform duration-200 group-hover:rotate-90" aria-hidden="true" />
                    {chip.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {isPending ? <Spinner className="size-3.5 text-ink-muted" label="Memuat hasil" /> : null}
        </div>

        <button
          ref={filterButtonRef}
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="catalog-filter"
          className="meta-caps inline-flex h-10 items-center gap-2 px-5 text-ink ring-1 ring-inset ring-ink transition-colors duration-200 hover:bg-ink hover:text-surface active:scale-[0.98]"
        >
          <FadersHorizontalIcon size={14} aria-hidden="true" />
          Filter By
        </button>
      </div>

      <div aria-busy={isPending} className={cn("mt-10 transition-opacity duration-200 md:mt-12", isPending && "pointer-events-none opacity-60")}>
        {children}
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        categories={categories}
        category={category}
        tag={tag}
        sort={sort}
        onChange={navigate}
        onReset={() => go(pathname)}
        hasFilters={hasFilters}
        total={null}
      />
    </div>
  );
}
