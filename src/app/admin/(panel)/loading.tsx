import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div role="status" aria-label="Memuat halaman">
      <div className="mb-10 space-y-3">
        <Skeleton className="h-11 w-60" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-card" />
        ))}
      </div>
      <Skeleton className="mt-6 h-96 rounded-card" />
    </div>
  );
}
