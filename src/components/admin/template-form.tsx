"use client";

import { ArrowSquareOutIcon, ArrowsClockwiseIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useState } from "react";
import { saveTemplateAction } from "@/actions/templates";
import { GalleryField, ImageField } from "@/components/admin/image-field";
import { Panel } from "@/components/admin/page-header";
import { SaveBar, isDirty, useUnsavedGuard } from "@/components/admin/save-bar";
import { DeleteTemplateButton } from "@/components/admin/template-row-controls";
import { useActionFeedback } from "@/components/admin/use-action-feedback";
import { TemplateCard } from "@/components/site/template-card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Switch, Textarea, fieldProps } from "@/components/ui/form";
import { formatRupiah } from "@/lib/format";
import { visibleOriginalPrice } from "@/lib/pricing";
import { slugify } from "@/lib/slug";
import { TEMPLATE_TAGS, sortTags, type TemplateTag } from "@/lib/tags";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/validation/common";

export type TemplateFormValues = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: string;
  originalPrice: string;
  thumbnail: string;
  gallery: string[];
  demoUrl: string;
  tags: TemplateTag[];
  features: string;
  isFeatured: boolean;
  isPublished: boolean;
};

const TAG_HINTS: Record<TemplateTag, string> = {
  "best-seller": "Label gelap di kartu + muncul di section Best Seller beranda",
  new: "Desain baru",
  promo: "Sedang diskon. Bisa isi harga coret.",
  premium: "Desain kelas atas",
};

const FORM_ID = "template-form";

export function TemplateForm({
  templateId,
  initial,
  categories,
  publicUrl,
}: {
  templateId: string | null;
  initial: TemplateFormValues;
  categories: { id: string; name: string; isActive: boolean }[];
  publicUrl?: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  // Titik acuan "sudah tersimpan"; diperbarui setiap kali simpan berhasil.
  const [baseline, setBaseline] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(templateId));
  const [state, formAction, pending] = useActionState<ActionResult<{ id: string }> | null, FormData>(
    saveTemplateAction.bind(null, templateId),
    null,
  );

  const dirty = isDirty(values, baseline);
  useUnsavedGuard(dirty && !pending);

  const onSuccess = useCallback(() => {
    setBaseline(values);
    if (templateId) {
      router.refresh();
    } else {
      router.push("/admin/templates");
      router.refresh();
    }
  }, [router, templateId, values]);
  useActionFeedback(state, onSuccess);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const galleryError = Object.entries(errors).find(([key]) => key.startsWith("gallery"))?.[1];
  const featuresError = Object.entries(errors).find(([key]) => key.startsWith("features"))?.[1];
  const advancedError = Boolean(errors.slug);

  function set<K extends keyof TemplateFormValues>(key: K, value: TemplateFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const priceNumber = Number(values.price.replace(/[^\d]/g, ""));
  const isPromo = values.tags.includes("promo");
  const originalNumber = Number(values.originalPrice.replace(/[^\d]/g, ""));
  const featureCount = values.features.split(/\r?\n/).filter((line) => line.trim()).length;
  const categoryName = categories.find((category) => category.id === values.categoryId)?.name ?? "Kategori";

  return (
    <form id={FORM_ID} action={formAction} noValidate>
      <p className="mb-5 text-sm text-ink-muted">
        Kolom bertanda <span className="text-danger">*</span> wajib diisi. Tombol simpan ada di bar bawah layar.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="1. Info utama" description="Yang tampil di kartu katalog: nama, kategori, harga, tag, dan tombol Demo.">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField id="name" label="Nama undangan" required error={errors.name} className="md:col-span-2">
                <Input
                  {...fieldProps("name", errors.name)}
                  name="name"
                  value={values.name}
                  maxLength={80}
                  onChange={(event) => {
                    const name = event.target.value;
                    setValues((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) }));
                  }}
                  placeholder="Contoh: Elegant Rose"
                />
              </FormField>

              <FormField id="categoryId" label="Kategori" required error={errors.categoryId}>
                <Select
                  {...fieldProps("categoryId", errors.categoryId)}
                  name="categoryId"
                  value={values.categoryId}
                  onChange={(event) => set("categoryId", event.target.value)}
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {category.isActive ? "" : " (disembunyikan)"}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                id="price"
                label={isPromo ? "Harga promo" : "Harga"}
                required
                error={errors.price}
                hint={
                  priceNumber
                    ? `Tampil sebagai ${formatRupiah(priceNumber)}${isPromo ? " (harga yang dibayar pelanggan)" : ""}`
                    : "Ketik angka saja, mis. 149000"
                }
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-muted">Rp</span>
                  <Input
                    {...fieldProps("price", errors.price, true)}
                    name="price"
                    inputMode="numeric"
                    value={values.price}
                    onChange={(event) => set("price", event.target.value.replace(/[^\d]/g, ""))}
                    className="tabular pl-11"
                    placeholder="149000"
                  />
                </div>
              </FormField>

              <FormField
                id="demoUrl"
                label="Link demo undangan"
                error={errors.demoUrl}
                hint="Dibuka di tab baru saat pengunjung menekan tombol Demo. Kosongkan bila belum ada demo."
                className="md:col-span-2"
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    {...fieldProps("demoUrl", errors.demoUrl, true)}
                    name="demoUrl"
                    value={values.demoUrl}
                    onChange={(event) => set("demoUrl", event.target.value.trim())}
                    placeholder="https://demo.contoh.id/elegant-rose"
                  />
                  <div className="flex shrink-0 gap-2">
                    {values.demoUrl ? (
                      <a
                        href={values.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center gap-1.5 rounded-control px-4 text-sm font-medium text-ink ring-1 ring-inset ring-line-strong transition-colors hover:bg-canvas hover:ring-accent"
                      >
                        Coba buka
                        <ArrowSquareOutIcon size={15} aria-hidden="true" />
                      </a>
                    ) : null}
                    <Button
                      variant="ghost"
                      className="h-11"
                      disabled={!values.slug}
                      onClick={() => set("demoUrl", `/demo/${values.slug}`)}
                      title="Halaman demo sederhana dari thumbnail dan galeri undangan ini"
                    >
                      Pakai demo bawaan
                    </Button>
                  </div>
                </div>
              </FormField>

              <fieldset className="md:col-span-2">
                <legend className="meta-caps font-semibold text-ink">Tag</legend>
                <p className="mt-0.5 text-sm text-ink-muted">Opsional. Tampil di kartu dan bisa difilter pengunjung. Boleh pilih lebih dari satu.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {TEMPLATE_TAGS.map((tag) => {
                    const checked = values.tags.includes(tag.value);
                    return (
                      <label
                        key={tag.value}
                        className={cn(
                          "flex cursor-pointer select-none items-start gap-3 rounded-control px-3.5 py-3 ring-1 ring-inset transition-colors duration-200",
                          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                          checked ? "bg-accent-soft ring-ink" : "bg-surface ring-line-strong hover:ring-accent",
                        )}
                      >
                        <input
                          type="checkbox"
                          name="tags"
                          value={tag.value}
                          checked={checked}
                          onChange={(event) =>
                            set(
                              "tags",
                              sortTags(event.target.checked ? [...values.tags, tag.value] : values.tags.filter((value) => value !== tag.value)),
                            )
                          }
                          className="mt-0.5 size-4 shrink-0 accent-ink"
                        />
                        <span>
                          <span className="block text-sm font-medium text-ink">{tag.label}</span>
                          <span className="block text-xs text-ink-muted">{TAG_HINTS[tag.value]}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {errors.tags ? (
                  <p role="alert" className="mt-2 text-sm text-danger">
                    {errors.tags}
                  </p>
                ) : null}

                {isPromo ? (
                  <div className="mt-4 rounded-control bg-accent-soft/60 p-4 ring-1 ring-inset ring-accent/40">
                    <FormField
                      id="originalPrice"
                      label="Harga sebelum diskon"
                      error={errors.originalPrice}
                      hint={
                        originalNumber > priceNumber && priceNumber > 0
                          ? `Tampil dicoret: ${formatRupiah(originalNumber)} · hemat ${formatRupiah(originalNumber - priceNumber)} (${Math.floor(((originalNumber - priceNumber) / originalNumber) * 100)}%)`
                          : "Opsional. Diisi = harga lama tampil dicoret di samping harga promo. Harus lebih besar dari harga promo."
                      }
                    >
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-muted">Rp</span>
                        <Input
                          {...fieldProps("originalPrice", errors.originalPrice, true)}
                          name="originalPrice"
                          inputMode="numeric"
                          value={values.originalPrice}
                          onChange={(event) => set("originalPrice", event.target.value.replace(/[^\d]/g, ""))}
                          className="tabular bg-surface pl-11"
                          placeholder="179000"
                        />
                      </div>
                    </FormField>
                  </div>
                ) : null}
              </fieldset>
            </div>
          </Panel>

          <Panel title="2. Gambar" description="Thumbnail tampil di kartu katalog. Galeri tampil di halaman detail.">
            <div className="space-y-8">
              <ImageField
                name="thumbnail"
                label="Thumbnail"
                required
                value={values.thumbnail}
                onChange={(url) => set("thumbnail", url)}
                error={errors.thumbnail}
                hint="Gambar tegak rasio 4:5 (mis. 1200×1500 px). JPG, PNG, atau WebP, maks. 4 MB."
              />
              <div>
                <p className="text-sm font-medium text-ink">Galeri</p>
                <p className="mb-3 text-sm text-ink-muted">Opsional. Gambar pertama juga muncul saat kartu disorot (hover) di katalog.</p>
                <GalleryField name="gallery" value={values.gallery} onChange={(urls) => set("gallery", urls)} error={galleryError} />
              </div>
            </div>
          </Panel>

          <Panel title="3. Halaman detail" description="Opsional. Teks yang tampil saat pengunjung membuka undangan ini.">
            <div className="space-y-5">
              <FormField id="description" label="Deskripsi" error={errors.description} hint="Pisahkan paragraf dengan baris kosong.">
                <Textarea
                  {...fieldProps("description", errors.description, true)}
                  name="description"
                  value={values.description}
                  maxLength={2000}
                  rows={5}
                  onChange={(event) => set("description", event.target.value)}
                />
              </FormField>
              <FormField id="features" label="Fitur yang didapat" error={featuresError} hint={`Satu fitur per baris · ${featureCount} fitur`}>
                <Textarea
                  {...fieldProps("features", featuresError, true)}
                  name="features"
                  value={values.features}
                  rows={6}
                  onChange={(event) => set("features", event.target.value)}
                  placeholder={"Galeri foto prewedding\nKonfirmasi kehadiran (RSVP)\nMusik latar"}
                />
              </FormField>
            </div>
          </Panel>

          <details open={advancedError || undefined} className="group rounded-card bg-surface ring-1 ring-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 md:px-6 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="title-caps block text-[0.8125rem] text-ink">Pengaturan lanjutan</span>
                <span className="mt-1 block text-sm text-ink-muted">Alamat halaman undangan. Biasanya tidak perlu diubah.</span>
              </span>
              <CaretRightIcon size={16} className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
            </summary>
            <div className="border-t border-line p-5 md:p-6">
              <FormField
                id="slug"
                label="Alamat halaman (slug)"
                required
                error={errors.slug}
                hint={`Halaman: /catalog/${values.slug || "nama-undangan"} · dibuat otomatis dari nama`}
              >
                <div className="flex gap-2">
                  <Input
                    {...fieldProps("slug", errors.slug, true)}
                    name="slug"
                    value={values.slug}
                    maxLength={80}
                    onChange={(event) => {
                      setSlugTouched(true);
                      set("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    placeholder="elegant-rose"
                  />
                  <Button
                    variant="secondary"
                    className="h-11 shrink-0"
                    onClick={() => {
                      setSlugTouched(false);
                      set("slug", slugify(values.name));
                    }}
                  >
                    <ArrowsClockwiseIcon size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">Buat dari nama</span>
                  </Button>
                </div>
              </FormField>
            </div>
          </details>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Panel title="Tampil di mana?">
            <div className="space-y-5">
              <Switch
                name="isPublished"
                label="Tampil di katalog"
                description="Matikan untuk menyimpan sebagai draft (tidak terlihat pengunjung)."
                checked={values.isPublished}
                onChange={(event) => set("isPublished", event.target.checked)}
              />
              <Switch
                name="isFeatured"
                label="Tampil di beranda"
                description="Masuk section Koleksi Pilihan di beranda."
                checked={values.isFeatured}
                onChange={(event) => set("isFeatured", event.target.checked)}
              />
              {publicUrl ? (
                <Link
                  href={publicUrl}
                  target="_blank"
                  className="meta-caps inline-flex items-center gap-1.5 border-b border-ink/25 pb-0.5 text-ink transition-colors hover:border-ink"
                >
                  Lihat halamannya di situs
                  <ArrowSquareOutIcon size={13} aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </Panel>

          <Panel title="Pratinjau kartu" description="Seperti yang dilihat pengunjung di katalog.">
            <div className="pointer-events-none mx-auto max-w-[17rem]" aria-hidden="true">
              <TemplateCard
                template={{
                  id: templateId ?? "preview",
                  name: values.name || "Nama undangan",
                  slug: values.slug || "preview",
                  price: priceNumber || 0,
                  originalPrice: visibleOriginalPrice({ price: priceNumber || 0, originalPrice: originalNumber || null, tags: values.tags }),
                  thumbnail: values.thumbnail || "/seed/hero/hero.webp",
                  previewImage: values.gallery[0] ?? null,
                  tags: values.tags,
                  isFeatured: values.isFeatured,
                  demoUrl: values.demoUrl || null,
                  category: { name: categoryName, slug: "" },
                }}
                sizes="272px"
                interactive={false}
              />
            </div>
          </Panel>

          {templateId ? (
            <Panel title="Hapus undangan" description="Permanen, termasuk galerinya.">
              <DeleteTemplateButton id={templateId} name={initial.name} variant="button" onDeleted={() => router.push("/admin/templates")} />
            </Panel>
          ) : null}
        </div>
      </div>

      {state && !state.ok ? (
        <p role="alert" className="mt-6 rounded-control bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <SaveBar
        form={FORM_ID}
        dirty={dirty || !templateId}
        pending={pending}
        onReset={templateId ? () => setValues(baseline) : undefined}
        saveLabel={templateId ? "Simpan perubahan" : "Simpan undangan"}
        dirtyText={templateId ? undefined : "Undangan baru, belum disimpan"}
      />
    </form>
  );
}
