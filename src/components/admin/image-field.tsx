"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ImageSquareIcon,
  LinkSimpleIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react/ssr";
import { useId, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/form";
import { SmartImage } from "@/components/ui/smart-image";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const ACCEPT_FAVICON = `${ACCEPT},image/x-icon,image/vnd.microsoft.icon,.ico`;

/** Unggah satu file ke /api/admin/upload; melempar Error berisi pesan yang bisa dibaca. */
export async function uploadImage(file: File, purpose: "image" | "favicon" = "image"): Promise<string> {
  const body = new FormData();
  body.set("file", file);
  body.set("purpose", purpose);
  let response: Response;
  try {
    response = await fetch("/api/admin/upload", { method: "POST", body });
  } catch {
    throw new Error("Koneksi terputus saat mengunggah. Coba lagi.");
  }
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error ?? "Gagal mengunggah gambar.");
  return data.url;
}

export function ImageField({
  name,
  label,
  value,
  onChange,
  hint,
  error,
  required,
  purpose = "image",
  aspect = "aspect-[4/5]",
  previewClassName,
  fit = "cover",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  purpose?: "image" | "favicon";
  aspect?: string;
  previewClassName?: string;
  fit?: "cover" | "contain";
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file, purpose));
      toast.success("Gambar berhasil diunggah. Jangan lupa simpan perubahan.");
    } catch (uploadError) {
      toast.error((uploadError as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "relative w-full overflow-hidden rounded-inner bg-canvas ring-1 transition-colors sm:w-44",
            aspect,
            dragging ? "ring-2 ring-ink" : error ? "ring-danger" : "ring-line-strong",
            previewClassName,
          )}
        >
          {value ? (
            <SmartImage
              src={value}
              alt={`Pratinjau ${label.toLowerCase()}`}
              fill
              sizes="176px"
              className={fit === "contain" ? "object-contain p-3" : "object-cover"}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-line-strong p-3 text-center text-xs text-ink-muted">
              <ImageSquareIcon size={28} aria-hidden="true" />
              Seret gambar ke sini
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 grid place-items-center bg-canvas/75 ">
              <Spinner className="size-6 text-ink" label="Mengunggah" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              aria-describedby={`${id}-label`}
              className="inline-flex h-10 items-center gap-2 rounded-control bg-surface px-4 text-sm font-medium text-ink ring-1 ring-line-strong transition-colors hover:bg-canvas disabled:opacity-60"
            >
              <UploadSimpleIcon size={17} aria-hidden="true" />
              {value ? "Ganti gambar" : "Unggah gambar"}
            </button>
            <button
              type="button"
              onClick={() => setShowUrl((v) => !v)}
              aria-expanded={showUrl}
              className="inline-flex h-10 items-center gap-2 rounded-control px-3 text-sm text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
            >
              <LinkSimpleIcon size={17} aria-hidden="true" />
              Pakai URL
            </button>
            {value && !required ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex h-10 items-center gap-2 rounded-control px-3 text-sm text-danger transition-colors hover:bg-danger-soft"
              >
                <TrashIcon size={17} aria-hidden="true" />
                Hapus
              </button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={purpose === "favicon" ? ACCEPT_FAVICON : ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          {showUrl ? (
            <div>
              <label htmlFor={`${id}-url`} className="sr-only">
                URL gambar {label}
              </label>
              <Input
                id={`${id}-url`}
                value={value}
                onChange={(event) => onChange(event.target.value.trim())}
                placeholder="https://... atau /media/..."
                className="h-11 text-sm"
              />
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">{hint ?? "JPG, PNG, WebP, atau AVIF. Maksimal 4 MB, otomatis dioptimasi."}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Daftar gambar galeri: unggah banyak sekaligus, urutkan, hapus. */
export function GalleryField({
  name,
  value,
  onChange,
  error,
}: {
  name: string;
  value: string[];
  onChange: (urls: string[]) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, Math.max(0, 12 - value.length));
    if (list.length < files.length) toast.error("Galeri maksimal 12 gambar; sebagian file dilewati.");
    let next = [...value];
    setProgress({ done: 0, total: list.length });
    for (const [index, file] of list.entries()) {
      try {
        next = [...next, await uploadImage(file)];
        onChange(next);
      } catch (uploadError) {
        toast.error(`${file.name}: ${(uploadError as Error).message}`);
      }
      setProgress({ done: index + 1, total: list.length });
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((url, index) => (
        <input key={`${url}-${index}`} type="hidden" name={name} value={url} />
      ))}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((url, index) => (
          <li key={`${url}-${index}`} className="group relative aspect-[4/5] overflow-hidden rounded-inner bg-canvas ring-1 ring-line">
            <SmartImage src={url} alt={`Gambar galeri ${index + 1}`} fill sizes="180px" className="object-cover" />
            <span className="tabular absolute left-2 top-2 rounded-control bg-ink/70 px-2 py-0.5 text-xs text-surface">{index + 1}</span>
            <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 rounded-control bg-surface/95 p-1 ring-1 ring-line">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Geser gambar ${index + 1} ke kiri`}
                className="grid size-8 place-items-center rounded-control text-ink-soft hover:bg-canvas disabled:opacity-30"
              >
                <ArrowLeftIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Hapus gambar ${index + 1}`}
                className="grid size-8 place-items-center rounded-control text-danger hover:bg-danger-soft"
              >
                <TrashIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === value.length - 1}
                aria-label={`Geser gambar ${index + 1} ke kanan`}
                className="grid size-8 place-items-center rounded-control text-ink-soft hover:bg-canvas disabled:opacity-30"
              >
                <ArrowRightIcon size={15} />
              </button>
            </div>
          </li>
        ))}
        {value.length < 12 ? (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={progress !== null}
              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-inner border border-dashed border-line-strong bg-canvas text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-70"
            >
              {progress ? (
                <>
                  <Spinner className="size-6 text-ink" />
                  <span className="tabular">
                    {progress.done}/{progress.total} terunggah
                  </span>
                </>
              ) : (
                <>
                  <PlusIcon size={24} aria-hidden="true" />
                  Tambah gambar
                </>
              )}
            </button>
          </li>
        ) : null}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : (
        <p className="text-sm text-ink-muted">Gambar tambahan di halaman detail, setelah thumbnail. Boleh pilih beberapa file sekaligus.</p>
      )}
    </div>
  );
}
