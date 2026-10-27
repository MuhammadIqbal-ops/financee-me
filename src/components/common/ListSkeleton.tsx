import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ListSkeletonProps {
  rows?: number;
  className?: string;
  /** Height of each row */
  rowHeight?: string;
}

/** Consistent loading skeleton for list/table rows across CRUD pages. */
export function ListSkeleton({ rows = 5, className, rowHeight = 'h-16' }: ListSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn('flex items-center justify-between gap-3 rounded-xl border bg-card p-3', rowHeight)}>
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}
