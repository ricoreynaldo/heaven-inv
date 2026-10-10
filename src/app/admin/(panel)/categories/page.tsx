import type { Metadata } from "next";
import { CategoryManager } from "@/components/admin/category-manager";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminCategories } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Kategori" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await listAdminCategories();
  return (
    <>
      <PageHeader
        title="Kategori"
        description="Kelompok undangan yang tampil di beranda dan sebagai filter katalog. Urutan di sini = urutan tampil di situs."
      />
      <CategoryManager
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          isActive: category.isActive,
          templateCount: category.templateCount,
        }))}
      />
    </>
  );
}
