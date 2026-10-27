import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

/** Shared client-side pagination bar with page-size selector. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageNumbers: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pageNumbers.push(p);
  }
  const pages = pageNumbers;

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3', className)}>
      <p className="text-xs text-muted-foreground order-2 sm:order-1">
        Menampilkan {start}–{end} dari {total} data
      </p>
      <div className="flex items-center justify-between gap-2 order-1 sm:order-2">
        {onPageSizeChange && (
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-9 w-[110px]" aria-label="Baris per halaman">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / hal.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Halaman sebelumnya">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pages.map((p, i) => (
            <span key={p} className="flex items-center">
              {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted-foreground text-xs">…</span>}
              <Button
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9 text-xs"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Button>
            </span>
          ))}
          <Button variant="outline" size="icon" className="h-9 w-9" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Halaman berikutnya">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
