import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { TemplateForm } from "@/components/admin/template-form";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/lib/auth/admin";
import { listCategoryOptions } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Tambah undangan" };

export default async function NewTemplatePage() {
  await requireAdmin();
  const categories = await listCategoryOptions();
  const back = (
    <Link href="/admin/templates" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
      <ArrowLeftIcon size={14} aria-hidden="true" />
      Katalog
    </Link>
  );

  if (categories.length === 0) {
    return (
      <>
        <PageHeader title="Tambah undangan" back={back} />
        <EmptyState
          title="Buat kategori terlebih dahulu"
          description="Setiap undangan harus masuk ke satu kategori."
          action={<ButtonLink href="/admin/categories">Kelola kategori</ButtonLink>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Tambah undangan" description="Isi info utama dan thumbnail, lalu simpan. Nyalakan Tampil di katalog bila sudah siap dilihat pengunjung." back={back} />
      <TemplateForm
        templateId={null}
        categories={categories}
        initial={{
          name: "",
          slug: "",
          description: "",
          categoryId: categories.find((category) => category.isActive)?.id ?? "",
          price: "",
          originalPrice: "",
          thumbnail: "",
          gallery: [],
          demoUrl: "",
          tags: [],
          features: "",
          isFeatured: false,
          isPublished: false,
        }}
      />
    </>
  );
}
