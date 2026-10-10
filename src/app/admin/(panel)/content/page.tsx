import type { Metadata } from "next";
import { ContentEditor } from "@/components/admin/content-editor";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminContent } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Konten beranda" };

export default async function AdminContentPage() {
  await requireAdmin();
  const content = await getAdminContent();
  return (
    <>
      <PageHeader
        title="Konten beranda"
        description="Teks dan gambar di halaman beranda. Pilih bagian, ubah isinya, lalu simpan. Undangan dan kategori diatur di menu masing-masing."
      />
      <ContentEditor content={content} />
    </>
  );
}
