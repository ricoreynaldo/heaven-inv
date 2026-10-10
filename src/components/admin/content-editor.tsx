"use client";

import { ArrowDownIcon, ArrowSquareOutIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react/ssr";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { saveContentAction } from "@/actions/site";
import { ImageField } from "@/components/admin/image-field";
import { useTabIndicator } from "@/components/motion/tab-indicator";
import { SaveBar, isDirty, useUnsavedGuard } from "@/components/admin/save-bar";
import { useActionFeedback } from "@/components/admin/use-action-feedback";
import { Button } from "@/components/ui/button";
import { ContentIcon } from "@/components/ui/content-icon";
import { FormField, Input, Select, Textarea, fieldProps } from "@/components/ui/form";
import type { ContentSection, SiteContent } from "@/lib/content/schema";
import { ICON_OPTIONS } from "@/lib/icon-keys";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/validation/common";

type FieldType = "text" | "textarea" | "image" | "link" | "email" | "icon";

type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  max?: number;
  rows?: number;
  hint?: string;
  required?: boolean;
  wide?: boolean;
};

type ListDef = {
  key: string;
  label: string;
  itemLabel: string;
  min: number;
  max: number;
  fields: FieldDef[];
  create: (index: number) => Record<string, string>;
};

type SectionDef = {
  section: ContentSection;
  tab: string;
  title: string;
  description: string;
  anchor?: string;
  fields: FieldDef[];
  list?: ListDef;
};

const SECTIONS: SectionDef[] = [
  {
    section: "hero",
    tab: "Bagian atas",
    title: "Bagian atas beranda",
    description: "Layar pertama: judul di tengah, keterangan di bawahnya, dua link (katalog & WhatsApp), dan kalimat pembuka di pojok kiri bawah. Sorotan undangan di pojok kanan bawah diambil otomatis dari tag Best Seller.",
    fields: [
      { key: "eyebrow", label: "Keterangan kecil di bawah judul", type: "text", max: 60, hint: "Opsional. Tampil abu-abu, huruf kapital." },
      {
        key: "headline",
        label: "Judul besar",
        type: "text",
        max: 120,
        required: true,
        wide: true,
        hint: "Tampil kapital di tengah layar, dipisah jadi dua baris di koma pertama.",
      },
      { key: "subtitle", label: "Kalimat pembuka", type: "textarea", max: 240, rows: 3, wide: true, hint: "Tampil kecil di pojok kiri bawah layar pertama." },
      { key: "primaryCta", label: "Teks link ke katalog", type: "text", max: 32, required: true },
      { key: "secondaryCta", label: "Teks link konsultasi WhatsApp", type: "text", max: 40, required: true },
      {
        key: "image",
        label: "Gambar cadangan",
        type: "image",
        required: true,
        hint: "Dipakai di sorotan pojok kanan bawah bila belum ada undangan Best Seller atau yang tampil di beranda.",
      },
    ],
  },
  {
    section: "featured",
    tab: "Koleksi Pilihan",
    title: "Section Koleksi Pilihan",
    description: "Judul di atas daftar undangan yang dinyalakan \"Tampil di beranda\" (diatur per undangan di menu Katalog).",
    fields: [
      { key: "title", label: "Judul", type: "text", max: 90, required: true, wide: true },
      { key: "subtitle", label: "Keterangan di bawah judul", type: "textarea", max: 200, rows: 2, wide: true },
    ],
  },
  {
    section: "categories",
    tab: "Kategori",
    title: "Section Kategori",
    description: "Judul di atas daftar nama kategori. Daftar kategorinya sendiri diatur di menu Kategori.",
    anchor: "#kategori",
    fields: [
      { key: "title", label: "Judul", type: "text", max: 90, required: true, wide: true },
      { key: "subtitle", label: "Keterangan di bawah judul", type: "textarea", max: 200, rows: 2, wide: true },
    ],
  },
  {
    section: "about",
    tab: "Tentang",
    title: "Section Tentang",
    description: "Judul dan cerita singkat tentang brand, di atas daftar keunggulan.",
    fields: [
      { key: "title", label: "Judul", type: "text", max: 120, required: true, wide: true },
      { key: "description", label: "Cerita", type: "textarea", max: 900, rows: 6, required: true, wide: true, hint: "Pisahkan paragraf dengan baris kosong." },
    ],
  },
  {
    section: "whyUs",
    tab: "Keunggulan",
    title: "Daftar keunggulan",
    description: "Poin-poin di bawah cerita section Tentang, tampil berjajar.",
    fields: [
      { key: "title", label: "Judul daftar", type: "text", max: 90, required: true },
      { key: "subtitle", label: "Keterangan", type: "text", max: 200, hint: "Tampil kecil di bawah judul daftar." },
    ],
    list: {
      key: "items",
      label: "Poin keunggulan",
      itemLabel: "Poin",
      min: 1,
      max: 8,
      fields: [
        { key: "icon", label: "Ikon", type: "icon" },
        { key: "title", label: "Judul", type: "text", max: 60, required: true },
        { key: "description", label: "Penjelasan", type: "textarea", max: 220, rows: 2, required: true, wide: true },
      ],
      create: () => ({ icon: "sparkle", title: "", description: "" }),
    },
  },
  {
    section: "howItWorks",
    tab: "Cara Pesan",
    title: "Section Cara Pesan",
    description: "Langkah-langkah memesan, tampil berjajar.",
    anchor: "#cara-pesan",
    fields: [
      { key: "title", label: "Judul", type: "text", max: 90, required: true },
      { key: "subtitle", label: "Keterangan di bawah judul", type: "text", max: 200 },
    ],
    list: {
      key: "steps",
      label: "Langkah",
      itemLabel: "Langkah",
      min: 1,
      max: 6,
      fields: [
        { key: "number", label: "Nomor", type: "text", max: 4, required: true, hint: "Mis. 01" },
        { key: "icon", label: "Ikon", type: "icon" },
        { key: "title", label: "Judul", type: "text", max: 60, required: true, wide: true },
        { key: "description", label: "Penjelasan", type: "textarea", max: 220, rows: 2, required: true, wide: true },
      ],
      create: (index) => ({ number: String(index + 1).padStart(2, "0"), icon: "check-circle", title: "", description: "" }),
    },
  },
  {
    section: "faq",
    tab: "FAQ",
    title: "Pertanyaan umum (FAQ)",
    description: "Daftar tanya-jawab yang bisa dibuka-tutup, setelah section Cara Pesan. Jawab hal yang paling sering ditanyakan lewat chat.",
    anchor: "#faq",
    fields: [
      { key: "title", label: "Judul", type: "text", max: 90, required: true },
      { key: "subtitle", label: "Keterangan di bawah judul", type: "text", max: 200 },
    ],
    list: {
      key: "items",
      label: "Pertanyaan",
      itemLabel: "Pertanyaan",
      min: 1,
      max: 12,
      fields: [
        { key: "question", label: "Pertanyaan", type: "text", max: 140, required: true, wide: true },
        {
          key: "answer",
          label: "Jawaban",
          type: "textarea",
          max: 600,
          rows: 3,
          required: true,
          wide: true,
          hint: "Pisahkan paragraf dengan baris kosong.",
        },
      ],
      create: () => ({ question: "", answer: "" }),
    },
  },
  {
    section: "cta",
    tab: "Ajakan penutup",
    title: "Ajakan penutup",
    description: "Ajakan terakhir sebelum footer: judul, keterangan, dan link.",
    fields: [
      { key: "title", label: "Judul", type: "text", max: 140, required: true, wide: true },
      { key: "description", label: "Keterangan", type: "textarea", max: 260, rows: 2, wide: true },
      { key: "buttonText", label: "Teks link", type: "text", max: 32, required: true },
      { key: "buttonLink", label: "Link menuju", type: "link", required: true, hint: "Mis. /catalog, #cara-pesan, atau https://..." },
    ],
  },
  {
    section: "footer",
    tab: "Footer",
    title: "Footer",
    description: "Bagian paling bawah situs. Kontak yang dikosongkan otomatis memakai isian di Pengaturan.",
    fields: [
      { key: "description", label: "Deskripsi singkat", type: "textarea", max: 300, rows: 3, wide: true },
      { key: "whatsapp", label: "WhatsApp", type: "text", max: 32, hint: "Kosongkan = pakai nomor di Pengaturan" },
      { key: "instagram", label: "Instagram", type: "text", max: 120, hint: "Username atau link profil" },
      { key: "email", label: "Email", type: "email" },
      { key: "copyright", label: "Teks hak cipta", type: "text", max: 160, required: true, hint: "Tulis {{year}} untuk tahun berjalan otomatis" },
    ],
  },
];

type Values = Record<string, unknown>;

function FieldControl({
  def,
  id,
  value,
  error,
  onChange,
}: {
  def: FieldDef;
  id: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  if (def.type === "image") {
    return <ImageField name={id} label={def.label} value={value} onChange={onChange} required={def.required} error={error} hint={def.hint} />;
  }
  if (def.type === "icon") {
    return (
      <FormField id={id} label={def.label} error={error}>
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-control bg-canvas text-ink ring-1 ring-line">
            <ContentIcon name={value} size={22} />
          </span>
          <Select {...fieldProps(id, error)} value={value} onChange={(event) => onChange(event.target.value)} className="flex-1">
            {ICON_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </FormField>
    );
  }
  const counter = def.max ? `${value.length}/${def.max}` : undefined;
  const hint = [def.hint, counter].filter(Boolean).join(" · ") || undefined;
  return (
    <FormField id={id} label={def.label} required={def.required} error={error} hint={hint}>
      {def.type === "textarea" ? (
        <Textarea {...fieldProps(id, error, Boolean(hint))} rows={def.rows ?? 3} maxLength={def.max} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <Input
          {...fieldProps(id, error, Boolean(hint))}
          type={def.type === "email" ? "email" : "text"}
          maxLength={def.max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FormField>
  );
}

function SectionForm({
  def,
  initial,
  onDirtyChange,
}: {
  def: SectionDef;
  initial: Values;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const baseId = useId();
  const [values, setValues] = useState<Values>(initial);
  const [baseline, setBaseline] = useState<Values>(initial);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(saveContentAction.bind(null, def.section), null);
  const dirty = isDirty(values, baseline);
  useUnsavedGuard(dirty && !pending);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  const onSuccess = useCallback(() => {
    setBaseline(values);
    router.refresh();
  }, [router, values]);
  useActionFeedback(state, onSuccess);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  const list = def.list;
  const items = list ? ((values[list.key] as Record<string, string>[]) ?? []) : [];

  function setItems(next: Record<string, string>[]) {
    if (list) setValues((current) => ({ ...current, [list.key]: next }));
  }

  return (
    <form action={formAction} noValidate className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(values)} />
      <div className="rounded-card bg-surface ring-1 ring-line">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            <h2 className="title-caps text-[0.8125rem] text-ink">{def.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{def.description}</p>
          </div>
          <a
            href={`/${def.anchor ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="meta-caps inline-flex shrink-0 items-center gap-1.5 border-b border-ink/25 pb-0.5 text-ink transition-colors hover:border-ink"
          >
            Lihat di beranda
            <ArrowSquareOutIcon size={13} aria-hidden="true" />
          </a>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
          {def.fields.map((field) => (
            <div key={field.key} className={cn((field.wide || field.type === "image") && "md:col-span-2")}>
              <FieldControl
                def={field}
                id={`${baseId}-${field.key}`}
                value={String(values[field.key] ?? "")}
                error={errors[field.key]}
                onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
              />
            </div>
          ))}
        </div>
      </div>

      {list ? (
        <div className="rounded-card bg-surface ring-1 ring-line">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
            <h3 className="title-caps text-[0.8125rem] text-ink">
              {list.label} <span className="tabular text-ink-muted">({items.length}/{list.max})</span>
            </h3>
            <Button
              variant="secondary"
              size="sm"
              disabled={items.length >= list.max}
              onClick={() => setItems([...items, list.create(items.length)])}
            >
              <PlusIcon size={16} aria-hidden="true" />
              Tambah
            </Button>
          </div>
          {errors[list.key] ? (
            <p role="alert" className="px-6 pt-4 text-sm text-danger">
              {errors[list.key]}
            </p>
          ) : null}
          <ol className="divide-y divide-line">
            {items.map((item, index) => (
              <li key={index} className="p-5 md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="meta-caps text-ink-muted">
                    {list.itemLabel} {index + 1}
                  </p>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...items];
                        [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
                        setItems(next);
                      }}
                      disabled={index === 0}
                      aria-label={`Naikkan ${list.itemLabel.toLowerCase()} ${index + 1}`}
                      className="grid size-10 place-items-center rounded-control text-ink-muted hover:bg-canvas hover:text-ink disabled:opacity-30"
                    >
                      <ArrowUpIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...items];
                        [next[index + 1], next[index]] = [next[index]!, next[index + 1]!];
                        setItems(next);
                      }}
                      disabled={index === items.length - 1}
                      aria-label={`Turunkan ${list.itemLabel.toLowerCase()} ${index + 1}`}
                      className="grid size-10 place-items-center rounded-control text-ink-muted hover:bg-canvas hover:text-ink disabled:opacity-30"
                    >
                      <ArrowDownIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                      disabled={items.length <= list.min}
                      aria-label={`Hapus ${list.itemLabel.toLowerCase()} ${index + 1}`}
                      className="grid size-10 place-items-center rounded-control text-ink-muted hover:bg-danger-soft hover:text-danger disabled:opacity-30"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {list.fields.map((field) => (
                    <div key={field.key} className={cn(field.wide && "md:col-span-2")}>
                      <FieldControl
                        def={field}
                        id={`${baseId}-${list.key}-${index}-${field.key}`}
                        value={String(item[field.key] ?? "")}
                        error={errors[`${list.key}.${index}.${field.key}`]}
                        onChange={(value) => setItems(items.map((it, i) => (i === index ? { ...it, [field.key]: value } : it)))}
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <SaveBar dirty={dirty} pending={pending} onReset={() => setValues(baseline)} saveLabel={`Simpan ${def.tab.toLowerCase()}`} />
    </form>
  );
}

export function ContentEditor({ content }: { content: SiteContent }) {
  const [active, setActiveRaw] = useState<ContentSection>("hero");
  const [dirty, setDirty] = useState(false);
  const tabsId = useId();
  const tabsRef = useRef<HTMLDivElement>(null);
  useTabIndicator(tabsRef, active);
  const current = SECTIONS.find((section) => section.section === active)!;

  // Pindah tab membuang isian yang belum disimpan: tanyakan dulu.
  function setActive(next: ContentSection) {
    if (next === active) return;
    if (dirty && !window.confirm(`Perubahan di "${current.tab}" belum disimpan. Pindah tab dan buang perubahannya?`)) return;
    setDirty(false);
    setActiveRaw(next);
  }

  const tabs: ReactNode = (
    <div
      ref={tabsRef}
      role="tablist"
      aria-label="Bagian beranda"
      className="group/tabs no-scrollbar relative -mx-4 flex gap-5 overflow-x-auto border-b border-line px-4 md:mx-0 md:gap-6 md:px-0"
    >
      <span data-tab-indicator="" aria-hidden="true" className="invisible absolute bottom-0 left-0 h-px w-0 bg-ink" />
      {SECTIONS.map((section) => {
        const selected = section.section === active;
        return (
          <button
            key={section.section}
            type="button"
            role="tab"
            id={`${tabsId}-tab-${section.section}`}
            aria-selected={selected}
            aria-controls={`${tabsId}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => setActive(section.section)}
            onKeyDown={(event) => {
              const index = SECTIONS.indexOf(section);
              const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : null;
              if (next === null) return;
              const target = SECTIONS[(next + SECTIONS.length) % SECTIONS.length]!;
              setActive(target.section);
              document.getElementById(`${tabsId}-tab-${target.section}`)?.focus();
            }}
            className={cn(
              "meta-caps relative z-10 inline-flex h-11 shrink-0 items-center gap-2 border-b border-transparent transition-colors duration-200 group-data-[ready]/tabs:border-transparent",
              selected ? "border-ink text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            <span className="tabular opacity-60">{SECTIONS.indexOf(section) + 1}</span>
            {section.tab}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        {tabs}
        <p className="mt-2 text-xs text-ink-muted">Nomor = urutan section dari atas ke bawah di beranda. Setiap tab disimpan sendiri-sendiri.</p>
      </div>
      <div role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-tab-${active}`}>
        <SectionForm key={active} def={current} initial={content[active] as Values} onDirtyChange={setDirty} />
      </div>
    </div>
  );
}
