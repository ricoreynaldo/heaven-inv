"use client";

import { ArrowSquareOutIcon, EyeIcon, EyeSlashIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { changePasswordAction } from "@/actions/auth";
import { saveSettingsAction } from "@/actions/site";
import { ImageField } from "@/components/admin/image-field";
import { useTabIndicator } from "@/components/motion/tab-indicator";
import { SaveBar, isDirty, useUnsavedGuard } from "@/components/admin/save-bar";
import { useActionFeedback } from "@/components/admin/use-action-feedback";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea, fieldProps } from "@/components/ui/form";
import type { SettingsGroup, SiteSettings } from "@/lib/settings/schema";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/validation/common";
import { ORDER_PLACEHOLDERS, buildOrderMessage, buildWhatsAppUrl, normalizeWhatsAppNumber, type OrderDetails } from "@/lib/whatsapp";

type DirtyReporter = (dirty: boolean) => void;

function useGroupForm<T extends Record<string, string>>(group: SettingsGroup, initial: T, onDirtyChange: DirtyReporter) {
  const router = useRouter();
  const [values, setValues] = useState<T>(initial);
  const [baseline, setBaseline] = useState<T>(initial);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(saveSettingsAction.bind(null, group), null);
  const dirty = isDirty(values, baseline);
  useUnsavedGuard(dirty && !pending);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  const onSuccess = useCallback(() => {
    setBaseline(values);
    router.refresh();
  }, [router, values]);
  useActionFeedback(state, onSuccess);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const set = (key: keyof T, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const reset = () => setValues(baseline);
  return { values, set, formAction, pending, errors, dirty, reset };
}

function GroupCard({
  title,
  description,
  children,
  form,
}: {
  title: string;
  description: string;
  children: ReactNode;
  form: { formAction: (formData: FormData) => void; values: unknown; pending: boolean; dirty: boolean; reset: () => void };
}) {
  return (
    <form action={form.formAction} noValidate>
      <input type="hidden" name="payload" value={JSON.stringify(form.values)} />
      <div className="rounded-card bg-surface ring-1 ring-line">
        <div className="border-b border-line px-5 py-4 md:px-6">
          <h2 className="title-caps text-[0.8125rem] text-ink">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        </div>
        <div className="p-5 md:p-6">{children}</div>
      </div>
      <SaveBar dirty={form.dirty} pending={form.pending} onReset={form.reset} />
    </form>
  );
}

function BrandSettings({ settings, onDirtyChange }: { settings: SiteSettings; onDirtyChange: DirtyReporter }) {
  const form = useGroupForm(
    "brand",
    { brandName: settings.brandName, logo: settings.logo, favicon: settings.favicon },
    onDirtyChange,
  );
  const { values, set, errors } = form;
  return (
    <GroupCard title="Identitas brand" description="Nama brand, logo di sampingnya, dan ikon yang tampil di tab browser." form={form}>
      <div className="space-y-6">
        <FormField id="brandName" label="Nama brand" required error={errors.brandName}>
          <Input {...fieldProps("brandName", errors.brandName)} value={values.brandName} maxLength={60} onChange={(e) => set("brandName", e.target.value)} />
        </FormField>
        <ImageField
          name="logo"
          label="Logo"
          value={values.logo}
          onChange={(url) => set("logo", url)}
          error={errors.logo}
          aspect="aspect-square"
          previewClassName="sm:w-28"
          fit="contain"
          hint="Opsional. Ikon/simbol persegi berlatar transparan (PNG/WebP, minimal 128×128 px). Tampil di kiri nama brand, tingginya menyesuaikan teks."
        />
        <ImageField
          name="favicon"
          label="Ikon tab browser (favicon)"
          value={values.favicon}
          onChange={(url) => set("favicon", url)}
          error={errors.favicon}
          purpose="favicon"
          aspect="aspect-square"
          previewClassName="sm:w-28"
          fit="contain"
          hint="Gambar persegi kecil di samping judul tab. Minimal 192×192 px. PNG, WebP, atau ICO."
        />
      </div>
    </GroupCard>
  );
}

const PLACEHOLDER_LABELS: Record<string, string> = {
  template_name: "Nama undangan",
  category: "Kategori",
  price: "Harga",
  demo_url: "Link demo",
};

function WhatsAppSettings({ settings, sample, onDirtyChange }: { settings: SiteSettings; sample: OrderDetails; onDirtyChange: DirtyReporter }) {
  const form = useGroupForm(
    "whatsapp",
    {
      whatsappNumber: settings.whatsappNumber,
      whatsappMessage: settings.whatsappMessage,
      whatsappConsultMessage: settings.whatsappConsultMessage,
    },
    onDirtyChange,
  );
  const { values, set, errors } = form;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const normalized = normalizeWhatsAppNumber(values.whatsappNumber);
  const preview = buildOrderMessage(values.whatsappMessage, sample);
  const testUrl = buildWhatsAppUrl(values.whatsappNumber, preview);

  function insertPlaceholder(key: string) {
    const token = `{{${key}}}`;
    const el = textareaRef.current;
    if (!el) return set("whatsappMessage", values.whatsappMessage + token);
    const start = el.selectionStart ?? values.whatsappMessage.length;
    const end = el.selectionEnd ?? start;
    const next = values.whatsappMessage.slice(0, start) + token + values.whatsappMessage.slice(end);
    set("whatsappMessage", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <GroupCard
      title="WhatsApp pemesanan"
      description="Nomor tujuan semua tombol Pesan & Konsultasi, dan isi pesan yang otomatis terketik di WhatsApp pelanggan."
      form={form}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <FormField
            id="whatsappNumber"
            label="Nomor WhatsApp admin"
            error={errors.whatsappNumber}
            hint={normalized ? `Disimpan sebagai ${normalized} (format wa.me)` : "Contoh: 0812 3456 7890 atau 6281234567890"}
          >
            <Input
              {...fieldProps("whatsappNumber", errors.whatsappNumber, true)}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={values.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
            />
          </FormField>
          <FormField
            id="whatsappMessage"
            label="Pesan saat pelanggan menekan Pesan"
            required
            error={errors.whatsappMessage}
            hint="Kata dalam {{kurung kurawal}} otomatis diganti detail undangan yang dipesan. Klik tombol di bawah untuk menyisipkannya."
          >
            <Textarea
              {...fieldProps("whatsappMessage", errors.whatsappMessage, true)}
              ref={textareaRef}
              rows={11}
              maxLength={1500}
              value={values.whatsappMessage}
              onChange={(e) => set("whatsappMessage", e.target.value)}
              className="font-mono text-sm"
            />
          </FormField>
          <div className="-mt-3 flex flex-wrap gap-2" aria-label="Placeholder tersedia">
            {ORDER_PLACEHOLDERS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => insertPlaceholder(key)}
                className="inline-flex items-center gap-1.5 rounded-control bg-accent-soft px-3 py-1.5 text-xs text-ink ring-1 ring-accent/30 transition-colors hover:bg-accent/25"
              >
                + {PLACEHOLDER_LABELS[key] ?? key}
                <span className="font-mono text-ink-muted">{`{{${key}}}`}</span>
              </button>
            ))}
          </div>
          <FormField id="whatsappConsultMessage" label="Pesan saat pelanggan menekan Konsultasi" required error={errors.whatsappConsultMessage} hint="Dipakai tombol Konsultasi di navbar, beranda, dan tombol WhatsApp bulat.">
            <Textarea
              {...fieldProps("whatsappConsultMessage", errors.whatsappConsultMessage, true)}
              rows={3}
              maxLength={600}
              value={values.whatsappConsultMessage}
              onChange={(e) => set("whatsappConsultMessage", e.target.value)}
            />
          </FormField>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Pratinjau pesan</p>
          <p className="text-sm text-ink-muted">Seperti ini pesan yang diterima admin, contoh untuk {sample.templateName}.</p>
          <div className="mt-3 rounded-card bg-[#efe7dc] p-4 ring-1 ring-line">
            <div className="ml-auto max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#dcf2d0] px-4 py-3 text-sm leading-relaxed text-ink shadow-sm">
              {preview}
            </div>
          </div>
          {testUrl ? (
            <a
              href={testUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-ink"
            >
              <WhatsappLogoIcon size={18} aria-hidden="true" />
              Coba tautan di WhatsApp
              <ArrowSquareOutIcon size={14} aria-hidden="true" />
            </a>
          ) : (
            <p className="mt-4 text-sm text-warning">Isi nomor WhatsApp yang valid. Tanpa nomor, semua tombol pesan di situs nonaktif.</p>
          )}
        </div>
      </div>
    </GroupCard>
  );
}

function ContactSettings({ settings, onDirtyChange }: { settings: SiteSettings; onDirtyChange: DirtyReporter }) {
  const form = useGroupForm(
    "contact",
    { instagram: settings.instagram, email: settings.email, address: settings.address },
    onDirtyChange,
  );
  const { values, set, errors } = form;
  return (
    <GroupCard title="Kontak" description="Tampil di footer dan menu ponsel. Kosongkan yang tidak ingin ditampilkan." form={form}>
      <div className="grid gap-5 md:grid-cols-2">
        <FormField id="instagram" label="Instagram" error={errors.instagram} hint="Username (heaveninv) atau URL profil.">
          <Input {...fieldProps("instagram", errors.instagram, true)} value={values.instagram} onChange={(e) => set("instagram", e.target.value)} />
        </FormField>
        <FormField id="email" label="Email" error={errors.email}>
          <Input {...fieldProps("email", errors.email)} type="email" inputMode="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
        </FormField>
        <FormField id="address" label="Alamat" error={errors.address} className="md:col-span-2">
          <Textarea {...fieldProps("address", errors.address)} rows={2} maxLength={240} value={values.address} onChange={(e) => set("address", e.target.value)} />
        </FormField>
      </div>
    </GroupCard>
  );
}

function SeoSettings({ settings, onDirtyChange }: { settings: SiteSettings; onDirtyChange: DirtyReporter }) {
  const form = useGroupForm(
    "seo",
    { seoTitle: settings.seoTitle, seoDescription: settings.seoDescription, ogImage: settings.ogImage },
    onDirtyChange,
  );
  const { values, set, errors } = form;
  return (
    <GroupCard
      title="Google & berbagi link"
      description="Cara situs tampil di hasil pencarian Google dan saat link-nya dikirim lewat WhatsApp atau media sosial."
      form={form}
    >
      <div className="space-y-5">
        <FormField id="seoTitle" label="Judul di hasil pencarian" required error={errors.seoTitle} hint={`${values.seoTitle.length}/70 karakter · ideal di bawah 60`}>
          <Input {...fieldProps("seoTitle", errors.seoTitle, true)} maxLength={70} value={values.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
        </FormField>
        <FormField id="seoDescription" label="Deskripsi di hasil pencarian" required error={errors.seoDescription} hint={`${values.seoDescription.length}/170 karakter · 1–2 kalimat`}>
          <Textarea {...fieldProps("seoDescription", errors.seoDescription, true)} rows={3} maxLength={170} value={values.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
        </FormField>
        <ImageField
          name="ogImage"
          label="Gambar saat link dibagikan"
          value={values.ogImage}
          onChange={(url) => set("ogImage", url)}
          error={errors.ogImage}
          aspect="aspect-[1200/630]"
          previewClassName="sm:w-60"
          hint="Gambar mendatar 1200×630 px yang muncul sebagai pratinjau link di WhatsApp, Instagram, dll."
        />
      </div>
    </GroupCard>
  );
}

function PasswordSettings() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(changePasswordAction, null);
  const [show, setShow] = useState(false);
  const onSuccess = useCallback(() => formRef.current?.reset(), []);
  useActionFeedback(state, onSuccess);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const type = show ? "text" : "password";

  return (
    <form ref={formRef} action={formAction} noValidate className="rounded-card bg-surface ring-1 ring-line">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
        <div>
          <h2 className="title-caps text-[0.8125rem] text-ink">Ganti password</h2>
          <p className="mt-0.5 text-sm text-ink-muted">Setelah diganti, login di perangkat lain otomatis keluar.</p>
        </div>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-control px-3 text-sm text-ink-soft hover:bg-canvas hover:text-ink"
        >
          {show ? <EyeSlashIcon size={18} aria-hidden="true" /> : <EyeIcon size={18} aria-hidden="true" />}
          {show ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-3 md:p-6">
        <FormField id="currentPassword" label="Password saat ini" required error={errors.currentPassword}>
          <Input {...fieldProps("currentPassword", errors.currentPassword)} name="currentPassword" type={type} autoComplete="current-password" />
        </FormField>
        <FormField id="newPassword" label="Password baru" required error={errors.newPassword} hint="Minimal 10 karakter.">
          <Input {...fieldProps("newPassword", errors.newPassword, true)} name="newPassword" type={type} autoComplete="new-password" />
        </FormField>
        <FormField id="confirmPassword" label="Ulangi password baru" required error={errors.confirmPassword}>
          <Input {...fieldProps("confirmPassword", errors.confirmPassword)} name="confirmPassword" type={type} autoComplete="new-password" />
        </FormField>
      </div>
      <div className="flex justify-end border-t border-line bg-canvas px-5 py-4 md:px-6">
        <Button type="submit" loading={pending}>
          Ganti password
        </Button>
      </div>
    </form>
  );
}

const TABS = [
  { id: "brand", label: "Identitas brand" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "contact", label: "Kontak" },
  { id: "seo", label: "Google & berbagi" },
  { id: "security", label: "Password" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function tabFromHash(): TabId {
  const hash = typeof window === "undefined" ? "" : window.location.hash.slice(1);
  return (TABS.find((tab) => tab.id === hash)?.id ?? "brand") as TabId;
}

export function SettingsEditor({ settings, sample }: { settings: SiteSettings; sample: OrderDetails }) {
  const [active, setActiveRaw] = useState<TabId>("brand");
  const [dirty, setDirty] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  useTabIndicator(tabsRef, active);

  // Link seperti /admin/settings#whatsapp (dari dashboard) langsung membuka tab-nya.
  useEffect(() => {
    const sync = () => setActiveRaw(tabFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function setActive(next: TabId) {
    if (next === active) return;
    const label = TABS.find((tab) => tab.id === active)?.label ?? "";
    if (dirty && !window.confirm(`Perubahan di "${label}" belum disimpan. Pindah tab dan buang perubahannya?`)) return;
    setDirty(false);
    setActiveRaw(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  return (
    <div className="space-y-6">
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Bagian pengaturan"
        className="group/tabs no-scrollbar relative -mx-4 flex gap-5 overflow-x-auto border-b border-line px-4 md:mx-0 md:gap-6 md:px-0"
      >
        <span data-tab-indicator="" aria-hidden="true" className="invisible absolute bottom-0 left-0 h-px w-0 bg-ink" />
        {TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.id)}
              className={cn(
                "meta-caps relative z-10 inline-flex h-11 shrink-0 items-center gap-2 border-b border-transparent transition-colors duration-200 group-data-[ready]/tabs:border-transparent",
                selected ? "border-ink text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        {active === "brand" ? <BrandSettings settings={settings} onDirtyChange={setDirty} /> : null}
        {active === "whatsapp" ? <WhatsAppSettings settings={settings} sample={sample} onDirtyChange={setDirty} /> : null}
        {active === "contact" ? <ContactSettings settings={settings} onDirtyChange={setDirty} /> : null}
        {active === "seo" ? <SeoSettings settings={settings} onDirtyChange={setDirty} /> : null}
        {active === "security" ? <PasswordSettings /> : null}
      </div>
    </div>
  );
}
