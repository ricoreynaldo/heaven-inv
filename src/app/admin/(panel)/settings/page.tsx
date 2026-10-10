import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsEditor } from "@/components/admin/settings-editor";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSettings, getSampleTemplate } from "@/lib/data/admin";
import { formatRupiah } from "@/lib/format";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [settings, sampleTemplate] = await Promise.all([getAdminSettings(), getSampleTemplate()]);

  const sample = sampleTemplate
    ? {
        templateName: sampleTemplate.name,
        category: sampleTemplate.category.name,
        price: formatRupiah(sampleTemplate.price),
        demoUrl: sampleTemplate.demoUrl ? absoluteUrl(sampleTemplate.demoUrl) : "",
      }
    : { templateName: "Elegant Rose", category: "Wedding", price: formatRupiah(149000), demoUrl: absoluteUrl("/demo/elegant-rose") };

  return (
    <>
      <PageHeader title="Pengaturan" description="Nama & logo, nomor WhatsApp pemesanan, kontak, tampilan di Google, dan password admin." />
      <SettingsEditor settings={settings} sample={sample} />
    </>
  );
}
