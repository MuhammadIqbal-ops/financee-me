import { ReactNode, forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnimatedContent } from '@/components/reactbits/AnimatedContent';
import { cn } from '@/lib/utils';

interface DataToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Filter slots rendered to the right of the search field (Selects, Buttons...) */
  filters?: ReactNode;
  /** Extra content on a second line (e.g. active filter chips, summary) */
  below?: ReactNode;
  className?: string;
}

/**
 * Shared list toolbar: debounced-by-consumer search field plus filter slots,
 * used across all CRUD pages for a consistent look.
 */
export const DataToolbar = forwardRef<HTMLInputElement, DataToolbarProps>(function DataToolbar(
  { search, onSearchChange, searchPlaceholder = 'Cari...', filters, below, className },
  ref
) {
  const hasSearch = onSearchChange !== undefined;

  return (
    <AnimatedContent className={cn('mb-4 space-y-2', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {hasSearch && (
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={ref}
              value={search ?? ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 pr-9 h-11"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => onSearchChange?.('')}
                aria-label="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
        {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      </div>
      {below}
    </AnimatedContent>
  );
});
