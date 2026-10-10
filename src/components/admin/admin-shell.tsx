"use client";

import {
  ArrowSquareOutIcon,
  ArticleIcon,
  GearSixIcon,
  ListIcon,
  SignOutIcon,
  SquaresFourIcon,
  StackIcon,
  TagIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logoutAction } from "@/actions/auth";
import { BrandMark } from "@/components/site/brand-mark";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: SquaresFourIcon, exact: true },
  { href: "/admin/templates", label: "Katalog", icon: StackIcon },
  { href: "/admin/categories", label: "Kategori", icon: TagIcon },
  { href: "/admin/content", label: "Konten beranda", icon: ArticleIcon },
  { href: "/admin/settings", label: "Pengaturan", icon: GearSixIcon },
];

function AdminSidebar({ brandName, logo, onNavigate }: { brandName: string; logo: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-line px-5">
        <Link href="/admin" onClick={onNavigate} aria-label={`${brandName} admin, ke dashboard`}>
          <BrandMark brandName={brandName} logo={logo} variant="caps" className="text-sm" />
        </Link>
        <span className="meta-caps text-ink-muted">Admin</span>
      </div>
      <nav aria-label="Navigasi admin" className="flex-1 px-3 py-4">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    // Aktif: teks tinta + garis tinta tipis di kiri (thesis v5), bukan blok hitam.
                    "meta-caps flex h-10 items-center gap-3 px-4 transition-colors duration-200",
                    active
                      ? "bg-canvas text-ink shadow-[inset_2px_0_0_var(--color-ink)]"
                      : "text-ink-muted hover:bg-canvas hover:text-ink",
                  )}
                >
                  <Icon size={16} weight={active ? "fill" : "regular"} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="meta-caps flex h-10 items-center gap-3 px-4 text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <ArrowSquareOutIcon size={16} aria-hidden="true" />
          Lihat situs
        </a>
      </div>
    </div>
  );
}

export function AdminShell({
  admin,
  brandName,
  logo,
  children,
}: {
  admin: { name: string; email: string };
  brandName: string;
  logo: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const initials = (admin.name || admin.email)
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <div className="min-h-dvh bg-surface">
      <a
        href="#admin-main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-control bg-ink px-5 py-3 text-sm text-surface transition-transform focus:translate-y-0"
      >
        Lewati ke konten
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
        <AdminSidebar brandName={brandName} logo={logo} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 animate-fade bg-ink/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[min(18rem,86vw)] animate-sheet border-r border-line bg-surface">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-control text-ink-muted hover:bg-canvas hover:text-ink"
              aria-label="Tutup menu"
            >
              <XIcon size={18} />
            </button>
            <AdminSidebar brandName={brandName} logo={logo} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-surface">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="grid size-10 place-items-center rounded-control text-ink hover:bg-ink/5 lg:hidden"
                aria-label="Buka menu admin"
                aria-expanded={open}
              >
                <ListIcon size={20} />
              </button>
              <Link href="/admin" className="lg:hidden" aria-label={`${brandName} admin, ke dashboard`}>
                <BrandMark brandName={brandName} logo={logo} variant="caps" className="text-sm" />
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="meta-caps font-semibold leading-tight text-ink">{admin.name}</p>
                <p className="text-xs text-ink-muted">{admin.email}</p>
              </div>
              <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-canvas text-[0.625rem] font-semibold tracking-[0.1em] text-ink ring-1 ring-line">
                {initials}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="meta-caps inline-flex h-9 items-center gap-2 px-3 text-ink-soft ring-1 ring-inset ring-line-strong transition-colors hover:bg-danger-soft hover:text-danger hover:ring-danger/25"
                >
                  <SignOutIcon size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">Keluar</span>
                  <span className="sr-only sm:hidden">Keluar</span>
                </button>
              </form>
            </div>
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-24 pt-8 outline-none md:px-8 md:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}
