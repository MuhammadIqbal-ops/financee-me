import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Unique id for a11y (used as part of the title element id) */
  className?: string;
}

/**
 * Add/Edit form container: a bottom Sheet on mobile (thumb-reachable,
 * swipe-to-dismiss) and a centered Dialog on desktop.
 */
export function ResponsiveFormDialog({ open, onOpenChange, title, description, children, className }: ResponsiveFormDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className={className ?? 'h-[92dvh] p-0 flex flex-col rounded-t-3xl'}>
          <SheetHeader className="shrink-0 px-4 pt-4 pb-3 border-b">
            <SheetTitle className="font-display text-lg">{title}</SheetTitle>
            {description && <SheetDescription className="text-xs">{description}</SheetDescription>}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className ?? 'sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col'}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
