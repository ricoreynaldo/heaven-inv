"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TagIcon, TrashIcon } from "@phosphor-icons/react/ssr";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useState } from "react";
import {
  deleteCategoryAction,
  moveCategoryAction,
  saveCategoryAction,
  setCategoryActiveAction,
} from "@/actions/categories";
import { ImageField } from "@/components/admin/image-field";
import { useActionFeedback, useServerAction } from "@/components/admin/use-action-feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, Input, Switch, Textarea, fieldProps } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SmartImage } from "@/components/ui/smart-image";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/validation/common";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  isActive: boolean;
  templateCount: number;
};

type Editing = { mode: "create" } | { mode: "edit"; category: CategoryRow } | null;

function CategoryForm({ category, onDone }: { category: CategoryRow | null; onDone: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    image: category?.image ?? "",
    isActive: category?.isActive ?? true,
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    saveCategoryAction.bind(null, category?.id ?? null),
    null,
  );
  const onSuccess = useCallback(() => {
    onDone();
    router.refresh();
  }, [onDone, router]);
  useActionFeedback(state, onSuccess);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormField id="category-name" label="Nama kategori" required error={errors.name}>
        <Input
          {...fieldProps("category-name", errors.name)}
          name="name"
          value={values.name}
          maxLength={60}
          autoFocus
          onChange={(event) => {
            const name = event.target.value;
            setValues((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) }));
          }}
        />
      </FormField>
      <FormField id="category-description" label="Deskripsi" error={errors.description} hint="Opsional. Kalimat singkat tentang kategori ini.">
        <Textarea
          {...fieldProps("category-description", errors.description, true)}
          name="description"
          rows={3}
          maxLength={300}
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
        />
      </FormField>
      <ImageField
        name="image"
        label="Gambar kategori"
        value={values.image}
        onChange={(image) => setValues((current) => ({ ...current, image }))}
        error={errors.image}
        aspect="aspect-square"
        hint="Muncul mengikuti kursor saat nama kategori disorot di beranda (layar komputer). Gambar persegi."
      />
      <Switch
        name="isActive"
        label="Tampil di situs"
        description="Bila dimatikan, kategori ini dan semua undangannya disembunyikan dari pengunjung."
        checked={values.isActive}
        onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))}
      />
      <details open={Boolean(errors.slug) || undefined} className="group rounded-inner ring-1 ring-line">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
          Pengaturan lanjutan
          <span className="text-xs font-normal text-ink-muted group-open:hidden">alamat filter</span>
        </summary>
        <div className="border-t border-line p-4">
          <FormField
            id="category-slug"
            label="Alamat filter (slug)"
            required
            error={errors.slug}
            hint={`Link: /catalog?category=${values.slug || "slug"} · dibuat otomatis dari nama`}
          >
            <Input
              {...fieldProps("category-slug", errors.slug, true)}
              name="slug"
              value={values.slug}
              maxLength={80}
              onChange={(event) => {
                setSlugTouched(true);
                setValues((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") }));
              }}
            />
          </FormField>
        </div>
      </details>
      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone} disabled={pending}>
          Batal
        </Button>
        <Button type="submit" loading={pending}>
          {category ? "Simpan perubahan" : "Tambah kategori"}
        </Button>
      </div>
    </form>
  );
}

function CategoryActions({ category, isFirst, isLast, onEdit }: { category: CategoryRow; isFirst: boolean; isLast: boolean; onEdit: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const toggle = useServerAction();
  const move = useServerAction();
  const remove = useServerAction();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
      <button
        type="button"
        role="switch"
        aria-checked={category.isActive}
        aria-label={`${category.isActive ? "Sembunyikan" : "Tampilkan"} kategori ${category.name}`}
        title={category.isActive ? "Terlihat pengunjung. Klik untuk menyembunyikan kategori beserta undangannya." : "Disembunyikan. Klik untuk menampilkan lagi."}
        disabled={toggle.pending}
        onClick={() => toggle.run(() => setCategoryActiveAction(category.id, !category.isActive))}
        className="inline-flex items-center gap-2 rounded-control py-1 pr-2 disabled:opacity-60"
      >
        <span className={cn("relative h-5 w-9 rounded-full transition-colors duration-200", category.isActive ? "bg-ink" : "bg-line-strong")}>
          <span className={cn("absolute left-0.5 top-0.5 size-4 rounded-full bg-surface transition-transform duration-200 ease-out", category.isActive && "translate-x-4")} />
        </span>
        <span className={cn("text-sm", category.isActive ? "text-ink" : "text-ink-muted")}>
          {category.isActive ? "Tampil" : "Disembunyikan"}
        </span>
      </button>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => move.run(() => moveCategoryAction(category.id, "up"))}
          disabled={move.pending || isFirst}
          aria-label={`Naikkan urutan ${category.name}`}
          className="grid size-10 place-items-center rounded-control text-ink-muted hover:bg-canvas hover:text-ink disabled:opacity-30"
        >
          <ArrowUpIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => move.run(() => moveCategoryAction(category.id, "down"))}
          disabled={move.pending || isLast}
          aria-label={`Turunkan urutan ${category.name}`}
          className="grid size-10 place-items-center rounded-control text-ink-muted hover:bg-canvas hover:text-ink disabled:opacity-30"
        >
          <ArrowDownIcon size={16} />
        </button>
        <Button variant="secondary" size="sm" onClick={onEdit} aria-label={`Edit ${category.name}`} className="mx-1">
          Edit
        </Button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Hapus ${category.name}`}
          title="Hapus kategori"
          className="grid size-10 place-items-center rounded-control text-ink-muted hover:bg-danger-soft hover:text-danger"
        >
          <TrashIcon size={18} />
        </button>
      </div>
      <ConfirmDialog
        open={confirming}
        title={`Hapus kategori "${category.name}"?`}
        description={
          category.templateCount > 0
            ? `Kategori ini masih berisi ${category.templateCount} undangan, jadi belum bisa dihapus. Pindahkan undangannya ke kategori lain lewat menu Katalog, atau sembunyikan kategori ini saja.`
            : "Kategori akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
        }
        confirmLabel={category.templateCount > 0 ? (category.isActive ? "Sembunyikan saja" : "Mengerti") : "Ya, hapus"}
        tone={category.templateCount > 0 ? "primary" : "danger"}
        pending={remove.pending || toggle.pending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          if (category.templateCount === 0) {
            remove.run(() => deleteCategoryAction(category.id), { onSuccess: () => setConfirming(false) });
          } else if (category.isActive) {
            toggle.run(() => setCategoryActiveAction(category.id, false), { onSuccess: () => setConfirming(false) });
          } else {
            setConfirming(false);
          }
        }}
      />
    </div>
  );
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const close = useCallback(() => setEditing(null), []);

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setEditing({ mode: "create" })}>
          <PlusIcon size={18} aria-hidden="true" />
          Tambah kategori
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<TagIcon size={26} aria-hidden="true" />}
          title="Belum ada kategori"
          description="Kategori membantu pengunjung menemukan undangan, mis. Wedding atau Birthday."
          action={<Button onClick={() => setEditing({ mode: "create" })}>Tambah kategori</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {categories.map((category, index) => (
            <li
              key={category.id}
              className="flex flex-col gap-4 rounded-card bg-surface p-4 ring-1 ring-line sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-inner bg-canvas ring-1 ring-line">
                  {category.image ? <SmartImage src={category.image} alt="" fill sizes="64px" className="object-cover" /> : null}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="title-caps text-sm text-ink">{category.name}</h2>
                    <Badge tone="neutral">{category.templateCount} undangan</Badge>
                  </div>
                  {category.description ? <p className="mt-1 line-clamp-1 text-sm text-ink-soft">{category.description}</p> : null}
                </div>
              </div>
              <CategoryActions
                category={category}
                isFirst={index === 0}
                isLast={index === categories.length - 1}
                onEdit={() => setEditing({ mode: "edit", category })}
              />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={close}
        title={editing?.mode === "edit" ? `Edit ${editing.category.name}` : "Tambah kategori"}
        description="Setelah disimpan, tampil di beranda dan filter katalog."
      >
        {editing ? (
          <CategoryForm
            key={editing.mode === "edit" ? editing.category.id : "new"}
            category={editing.mode === "edit" ? editing.category : null}
            onDone={close}
          />
        ) : null}
      </Modal>
    </>
  );
}
