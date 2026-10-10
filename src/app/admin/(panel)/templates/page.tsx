import { PlusIcon, StackIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { TemplateFilters } from "@/components/admin/template-filters";
import {
  BestSellerToggle,
  FeaturedToggle,
  PublishToggle,
  ReorderButtons,
  TemplateRowMenu,
} from "@/components/admin/template-row-controls";
import { Badge, TemplateTagPill } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { requireAdmin } from "@/lib/auth/admin";
import {
  ADMIN_PAGE_SIZE,
  listAdminTemplates,
  listCategoryOptions,
  parseAdminTemplateFilter,
  type AdminTemplateFilter,
} from "@/lib/data/admin";
import { formatDate, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Katalog" };

type Row = Awaited<ReturnType<typeof listAdminTemplates>>["items"][number];

function pageHref(filter: AdminTemplateFilter, page: number) {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.status !== "all") params.set("status", filter.status);
  if (filter.category) params.set("category", filter.category);
  if (filter.tag) params.set("tag", filter.tag);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/templates?${qs}` : "/admin/templates";
}

export default async function AdminTemplatesPage(props: PageProps<"/admin/templates">) {
  await requireAdmin();
  const filter = parseAdminTemplateFilter(await props.searchParams);
  const [result, categories] = await Promise.all([listAdminTemplates(filter), listCategoryOptions()]);
  const filtered = Boolean(filter.q || filter.status !== "all" || filter.category || filter.tag);
  // Urutan hanya bermakna saat melihat seluruh katalog tanpa filter.
  const canReorder = !filtered;
  const offset = (result.page - 1) * ADMIN_PAGE_SIZE;
  const editHref = (row: Row) => `/admin/templates/${row.id}/edit`;
  const publicUrl = (row: Row) => (row.isPublished && row.category.isActive ? `/catalog/${row.slug}` : null);

  const nameCell = (row: Row) => (
    <div className="flex items-center gap-3">
      <Link href={editHref(row)} className="relative block h-16 w-[3.25rem] shrink-0 overflow-hidden rounded-inner bg-canvas ring-1 ring-line" tabIndex={-1} aria-hidden="true">
        <SmartImage src={row.thumbnail} alt="" fill sizes="52px" className="object-cover" />
      </Link>
      <div className="min-w-0">
        <Link href={editHref(row)} className="font-medium text-ink underline-offset-4 hover:underline">
          {row.name}
        </Link>
        <p className="truncate text-xs text-ink-muted">
          {row.category.name} · <span className="tabular">{formatRupiah(row.price)}</span>
          {row.originalPrice ? <s className="tabular ml-1 text-ink-muted/80">{formatRupiah(row.originalPrice)}</s> : null}
          {row.demoUrl ? null : <span className="text-warning"> · belum ada demo</span>}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {row.tags
            .filter((tag) => tag !== "best-seller")
            .map((tag) => (
              <TemplateTagPill key={tag} tag={tag} />
            ))}
          {!row.category.isActive ? <Badge tone="warning">Kategori disembunyikan</Badge> : null}
        </div>
      </div>
    </div>
  );

  const actions = (row: Row) => (
    <div className="flex items-center justify-end gap-1">
      <ButtonLink href={editHref(row)} variant="secondary" size="sm">
        Edit
      </ButtonLink>
      <TemplateRowMenu id={row.id} name={row.name} publicUrl={publicUrl(row)} demoUrl={row.demoUrl} />
    </div>
  );

  const columns: Column<Row>[] = [
    ...(canReorder
      ? [
          {
            key: "order",
            header: "Urutan",
            className: "w-20",
            cell: (row: Row) => {
              const index = result.items.indexOf(row) + offset;
              return <ReorderButtons id={row.id} name={row.name} isFirst={index === 0} isLast={index === result.total - 1} />;
            },
          },
        ]
      : []),
    { key: "name", header: "Undangan", cell: nameCell },
    { key: "status", header: "Di situs", cell: (row) => <PublishToggle id={row.id} name={row.name} value={row.isPublished} /> },
    {
      key: "labels",
      header: "Sorotan",
      cell: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <BestSellerToggle id={row.id} name={row.name} value={row.tags.includes("best-seller")} />
          <FeaturedToggle id={row.id} name={row.name} value={row.isFeatured} />
        </div>
      ),
    },
    {
      key: "updated",
      header: "Diubah",
      className: "hidden 2xl:table-cell",
      cell: (row) => <span className="whitespace-nowrap text-ink-muted">{formatDate(row.updatedAt)}</span>,
    },
    { key: "actions", header: "Aksi", srOnlyHeader: true, className: "text-right", cell: actions },
  ];

  return (
    <>
      <PageHeader
        title="Katalog"
        description="Semua undangan yang dijual. Klik nama atau Edit untuk mengubah thumbnail, harga, kategori, tag, dan link demo."
        actions={
          <ButtonLink href="/admin/templates/new">
            <PlusIcon size={16} aria-hidden="true" />
            Tambah undangan
          </ButtonLink>
        }
      />

      <TemplateFilters counts={result.counts} categories={categories} />

      <details className="group mb-5 text-sm text-ink-soft">
        <summary className="meta-caps inline-flex cursor-pointer list-none items-center gap-1.5 border-b border-ink/25 pb-0.5 text-ink-muted transition-colors hover:border-ink hover:text-ink [&::-webkit-details-marker]:hidden">
          Apa arti tombol-tombol di tabel?
        </summary>
        <dl className="mt-3 grid gap-x-8 gap-y-2 rounded-card bg-surface p-4 ring-1 ring-line sm:grid-cols-2">
          <div>
            <dt className="font-medium text-ink">Di situs: Tampil / Draft</dt>
            <dd>Draft tidak terlihat pengunjung. Pakai saat undangan belum siap.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Best Seller</dt>
            <dd>Label gelap di kartu, masuk section Best Seller dan sorotan di pojok kanan bawah layar pertama beranda.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Beranda</dt>
            <dd>Masuk section Koleksi Pilihan di beranda.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Urutan ↑ ↓</dt>
            <dd>Urutan tampil di katalog (pilihan &quot;Rekomendasi&quot;). Muncul saat tidak ada filter.</dd>
          </div>
        </dl>
      </details>

      {filtered && result.total > 0 ? (
        <p className="mb-4 text-sm text-ink-muted">
          Menampilkan <span className="tabular">{result.total}</span> dari <span className="tabular">{result.allTotal}</span> undangan.{" "}
          <Link href="/admin/templates" className="text-ink underline decoration-accent underline-offset-4 hover:decoration-ink">
            Tampilkan semua
          </Link>{" "}
          untuk mengatur urutan.
        </p>
      ) : null}

      {result.total === 0 ? (
        <EmptyState
          icon={<StackIcon size={22} aria-hidden="true" />}
          title={filtered ? "Tidak ada undangan yang cocok" : "Katalog masih kosong"}
          description={filtered ? "Coba kata lain atau pilih tab Semua." : "Tambahkan undangan pertama, lalu nyalakan Tampil agar terlihat di situs."}
          action={
            filtered ? (
              <ButtonLink href="/admin/templates" variant="secondary">
                Tampilkan semua
              </ButtonLink>
            ) : (
              <ButtonLink href="/admin/templates/new">Tambah undangan</ButtonLink>
            )
          }
        />
      ) : (
        <DataTable
          caption="Daftar undangan"
          columns={columns}
          rows={result.items}
          rowKey={(row) => row.id}
          renderMobile={(row) => {
            const index = result.items.indexOf(row) + offset;
            return (
              <div>
                {nameCell(row)}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                  <PublishToggle id={row.id} name={row.name} value={row.isPublished} />
                  <span className="flex-1" />
                  <BestSellerToggle id={row.id} name={row.name} value={row.tags.includes("best-seller")} />
                  <FeaturedToggle id={row.id} name={row.name} value={row.isFeatured} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  {canReorder ? <ReorderButtons id={row.id} name={row.name} isFirst={index === 0} isLast={index === result.total - 1} /> : <span />}
                  {actions(row)}
                </div>
              </div>
            );
          }}
        />
      )}

      {result.pageCount > 1 ? (
        <nav aria-label="Halaman" className="mt-8 flex flex-wrap justify-center gap-2">
          {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={pageHref(filter, page)}
              aria-current={page === result.page ? "page" : undefined}
              className={cn(
                "tabular grid size-10 place-items-center rounded-control text-sm",
                page === result.page ? "bg-ink text-surface" : "bg-surface text-ink-soft ring-1 ring-inset ring-line-strong hover:text-ink",
              )}
            >
              {page}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}
