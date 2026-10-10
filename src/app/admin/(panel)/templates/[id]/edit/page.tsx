import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { TemplateForm } from "@/components/admin/template-form";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/admin";
import { getTemplateForEdit, listCategoryOptions } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Edit Undangan" };

export default async function EditTemplatePage(props: PageProps<"/admin/templates/[id]/edit">) {
  await requireAdmin();
  const { id } = await props.params;
  const [template, categories] = await Promise.all([getTemplateForEdit(id), listCategoryOptions()]);
  if (!template) notFound();

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {template.name}
            <Badge tone={template.isPublished ? "success" : "neutral"}>{template.isPublished ? "Tampil" : "Draft"}</Badge>
          </span>
        }
        back={
          <Link href="/admin/templates" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <ArrowLeftIcon size={14} aria-hidden="true" />
            Katalog
          </Link>
        }
      />
      <TemplateForm
        key={template.id}
        templateId={template.id}
        categories={categories}
        publicUrl={template.isPublished ? `/catalog/${template.slug}` : null}
        initial={{
          name: template.name,
          slug: template.slug,
          description: template.description,
          categoryId: template.categoryId,
          price: String(template.price),
          originalPrice: template.originalPrice ? String(template.originalPrice) : "",
          thumbnail: template.thumbnail,
          gallery: template.images.map((image) => image.url),
          demoUrl: template.demoUrl ?? "",
          tags: template.tags,
          features: template.features.join("\n"),
          isFeatured: template.isFeatured,
          isPublished: template.isPublished,
        }}
      />
    </>
  );
}
