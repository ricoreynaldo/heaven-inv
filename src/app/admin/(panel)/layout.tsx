import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth/admin";
import { getSettings } from "@/lib/data/public";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Seluruh panel bergantung pada sesi admin per request, jadi tidak ada static
 * shell yang bisa dibagikan antar pengguna. Navigasi boleh menunggu server;
 * loading.tsx menampilkan skeleton selama itu.
 */
export const instant = false;

/** Sesi dibaca per request, jadi seluruh panel di-stream di balik Suspense. */
async function AuthorizedShell({ children }: { children: ReactNode }) {
  const [admin, settings] = await Promise.all([requireAdmin(), getSettings()]);
  return (
    <AdminShell admin={{ name: admin.name, email: admin.email }} brandName={settings.brandName} logo={settings.logo}>
      {children}
    </AdminShell>
  );
}

function PanelSkeleton() {
  return (
    <div className="min-h-dvh bg-surface lg:pl-64" role="status" aria-label="Memuat panel admin">
      <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface lg:block" />
      <div className="h-16 border-b border-line" />
      <div className="mx-auto max-w-6xl space-y-6 px-4 pt-10 md:px-8">
        <Skeleton className="h-11 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-card" />
      </div>
    </div>
  );
}

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <AuthorizedShell>{children}</AuthorizedShell>
    </Suspense>
  );
}
