import {
  ArrowRightIcon,
  ArticleIcon,
  DatabaseIcon,
  NotePencilIcon,
  PlusIcon,
  TagIcon,
  WarningIcon,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { CountUp } from "@/components/motion/count-up";
import { Badge, TemplateTagPill } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSettings, getDashboardStats, getRecentTemplates } from "@/lib/data/admin";
import { formatDate, formatRupiah } from "@/lib/format";
import { resolveStoreDriver } from "@/lib/store";

export const metadata: Metadata = { title: "Dashboard" };

/** Nomor contoh dari seed — dashboard mengingatkan admin untuk menggantinya. */
const PLACEHOLDER_NUMBER = "6281234567890";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const [stats, recent, settings] = await Promise.all([getDashboardStats(), getRecentTemplates(6), getAdminSettings()]);

  const tiles = [
    { label: "Total undangan", value: stats.total, note: `${stats.published} published · ${stats.draft} draft`, href: "/admin/templates" },
    { label: "Best Seller", value: stats.bestSeller, note: "Bertag Best Seller", href: "/admin/templates?tag=best-seller" },
    { label: "Di beranda", value: stats.featured, note: "Section Koleksi Pilihan", href: "/admin/templates?status=featured" },
    { label: "Kategori", value: stats.categories, note: `${stats.activeCategories} aktif`, href: "/admin/categories" },
  ];

  const needsWhatsApp = !settings.whatsappNumber || settings.whatsappNumber === PLACEHOLDER_NUMBER;

  return (
    <>
      <PageHeader
        title={`Halo, ${admin.name.split(" ")[0]}`}
        description="Ringkasan katalog dan pintasan untuk pekerjaan yang paling sering dilakukan."
        actions={
          <ButtonLink href="/admin/templates/new">
            <PlusIcon size={16} aria-hidden="true" />
            Tambah undangan
          </ButtonLink>
        }
      />

      {resolveStoreDriver() === "json" ? (
        <div className="mb-4 flex gap-3 rounded-card bg-accent-soft p-4 text-sm text-ink">
          <DatabaseIcon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Mode data dummy: semua perubahan disimpan di file <code className="rounded bg-surface px-1.5 py-0.5 text-xs">.data/db.json</code>.
            Hapus file itu untuk kembali ke data contoh.
          </p>
        </div>
      ) : null}

      {needsWhatsApp ? (
        <div role="status" className="mb-8 flex flex-col gap-4 rounded-card bg-warning-soft p-4 ring-1 ring-warning/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <WarningIcon size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-medium text-ink">Nomor WhatsApp admin masih nomor contoh</p>
              <p className="text-ink-soft">Semua tombol pesan mengarah ke nomor ini. Ganti dengan nomor aktif sebelum situs dipromosikan.</p>
            </div>
          </div>
          <ButtonLink href="/admin/settings#whatsapp" variant="secondary" size="sm">
            Atur WhatsApp
          </ButtonLink>
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-line ring-1 ring-line lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label} className="flex">
            <Link href={tile.href} className="group flex w-full flex-col bg-surface p-5 transition-colors duration-200 hover:bg-canvas">
              <span className="meta-caps flex items-center justify-between text-ink-muted">
                {tile.label}
                <ArrowRightIcon
                  size={14}
                  className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
              <CountUp value={tile.value} className="tabular mt-6 text-5xl font-light leading-none tracking-[0.02em] text-ink" />
              <span className="mt-2 text-sm text-ink-soft">{tile.note}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          title="Terakhir diubah"
          className="lg:col-span-2"
          actions={
            <Link href="/admin/templates" className="meta-caps inline-flex items-center gap-1.5 border-b border-ink/25 pb-0.5 text-ink transition-colors hover:border-ink">
              Kelola katalog
              <ArrowRightIcon size={13} aria-hidden="true" />
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              title="Belum ada undangan"
              description="Tambahkan undangan pertama untuk mulai mengisi katalog."
              action={<ButtonLink href="/admin/templates/new">Tambah undangan</ButtonLink>}
            />
          ) : (
            <ul className="-my-2 divide-y divide-line">
              {recent.map((template) => (
                <li key={template.id}>
                  <Link
                    href={`/admin/templates/${template.id}/edit`}
                    className="-mx-2 flex items-center gap-4 rounded-inner px-2 py-3 transition-colors hover:bg-canvas"
                  >
                    <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-inner bg-canvas ring-1 ring-line">
                      <SmartImage src={template.thumbnail} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium text-ink">{template.name}</span>
                        {template.tags.includes("best-seller") ? <TemplateTagPill tag="best-seller" /> : null}
                      </span>
                      <span className="block truncate text-sm text-ink-muted">
                        {template.category.name} · <span className="tabular">{formatRupiah(template.price)}</span>
                      </span>
                    </span>
                    <span className="hidden flex-col items-end gap-1 sm:flex">
                      <Badge tone={template.isPublished ? "success" : "neutral"}>{template.isPublished ? "Tampil" : "Draft"}</Badge>
                      <span className="text-xs text-ink-muted">{formatDate(template.updatedAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pintasan">
          <ul className="space-y-2">
            {[
              { href: "/admin/content", label: "Konten beranda", note: "Judul, keunggulan, cara pesan", icon: ArticleIcon },
              { href: "/admin/categories", label: "Kategori", note: "Tambah, urutkan, nonaktifkan", icon: TagIcon },
              { href: "/admin/settings#whatsapp", label: "Pesan WhatsApp", note: "Nomor & isi pesan order", icon: NotePencilIcon },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-inner p-3 ring-1 ring-inset ring-line transition-colors hover:bg-canvas hover:ring-accent"
                  >
                    <span className="grid size-9 shrink-0 place-items-center bg-canvas text-ink ring-1 ring-inset ring-line">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="meta-caps block font-semibold text-ink">{item.label}</span>
                      <span className="block text-xs text-ink-muted">{item.note}</span>
                    </span>
                    <ArrowRightIcon size={14} className="text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </>
  );
}
