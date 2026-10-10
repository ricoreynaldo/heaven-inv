import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import { FlipGrid } from "@/components/motion/flip-grid";
import { CatalogPagination } from "@/components/site/catalog-pagination";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateCard } from "@/components/site/template-card";
import { searchTemplates } from "@/lib/data/public";
import { tagLabel } from "@/lib/tags";
import { parseCatalogQuery, type CatalogQuery } from "@/lib/validation/catalog";

/** 4 kolom dengan jarak baris besar (thesis v3), 2 kolom di HP. */
const GRID = "grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-20 xl:grid-cols-4";

function pageHref(query: CatalogQuery, page: number) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.sort !== "recommended") params.set("sort", query.sort);
  if (query.tag) params.set("tag", query.tag);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

export async function CatalogResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseCatalogQuery(await searchParams);
  const result = await searchTemplates(query);

  if (result.total === 0) {
    return (
      <EmptyState
        icon={<MagnifyingGlassIcon size={22} aria-hidden="true" />}
        title="Belum ada undangan yang cocok"
        description={
          query.q
            ? `Tidak ada hasil untuk "${query.q}". Coba kata lain atau hapus beberapa filter.`
            : query.tag
              ? `Belum ada undangan bertag ${tagLabel(query.tag)} di filter ini.`
              : "Coba pilih kategori lain atau hapus filter yang aktif."
        }
        action={
          <ButtonLink href="/catalog" variant="outline">
            Lihat semua undangan
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div>
      <p className="mb-8 text-xs text-ink-muted" aria-live="polite">
        <span className="tabular text-ink">{result.total}</span> undangan
      </p>
      <FlipGrid itemKeys={result.items.map((item) => item.id).join(",")} className={GRID}>
        {result.items.map((template, index) => (
          <li key={template.id} data-flip-id={template.id} className="flex">
            <TemplateCard template={template} priority={index < 4 && result.page === 1} className="w-full" headingLevel="h2" />
          </li>
        ))}
      </FlipGrid>

      {result.pageCount > 1 ? (
        <CatalogPagination
          page={result.page}
          pageCount={result.pageCount}
          prevHref={result.page > 1 ? pageHref(query, result.page - 1) : null}
          nextHref={result.page < result.pageCount ? pageHref(query, result.page + 1) : null}
        />
      ) : null}
    </div>
  );
}

export function CatalogGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Memuat undangan">
      <Skeleton className="mb-8 h-3 w-20" />
      <div className={GRID}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[4/5]" />
            <Skeleton className="mt-4 h-3.5 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CatalogFiltersSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="hidden h-3 w-72 md:block" />
      </div>
      <div className="mt-12 flex items-center justify-between md:mt-16">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}
