import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { BrandMark } from "@/components/site/brand-mark";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings } from "@/lib/data/public";
import { DUMMY_ADMIN_EMAIL, DUMMY_ADMIN_PASSWORD } from "@/lib/store/seed";

export const metadata: Metadata = {
  title: "Masuk Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const settings = await getSettings();
  const showDummyHint = process.env.NODE_ENV !== "production";
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block" aria-label={`${settings.brandName}, ke situs`}>
          <BrandMark brandName={settings.brandName} logo={settings.logo} variant="caps" className="text-[0.9375rem]" />
        </Link>
        <div className="mt-8 rounded-card bg-surface p-6 ring-1 ring-line sm:p-8">
          <h1 className="title-caps text-xl text-ink">Masuk</h1>
          <p className="meta-caps mt-2 text-ink-muted">Panel admin</p>
          <p className="mt-4 text-sm text-ink-soft">Kelola katalog, konten, dan pengaturan dari satu tempat.</p>
          <div className="mt-7">
            <Suspense
              fallback={
                <div className="space-y-5">
                  <Skeleton className="h-18" />
                  <Skeleton className="h-18" />
                  <Skeleton className="h-12 rounded-control" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
        {showDummyHint ? (
          <p className="mt-5 rounded-inner bg-accent-soft px-4 py-3 text-xs leading-relaxed text-ink">
            Mode data dummy. Email: <code>{process.env.SEED_ADMIN_EMAIL || DUMMY_ADMIN_EMAIL}</code>. Password: nilai{" "}
            <code>SEED_ADMIN_PASSWORD</code> di <code>.env</code> (min. 10 karakter), atau <code>{DUMMY_ADMIN_PASSWORD}</code> bila kosong.
          </p>
        ) : null}
      </div>
    </main>
  );
}
