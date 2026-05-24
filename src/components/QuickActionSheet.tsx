import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, Target, RefreshCw, CreditCard } from 'lucide-react';

interface QuickActionSheetProps {
  trigger: ReactNode;
}

export function QuickActionSheet({ trigger }: QuickActionSheetProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const actions = [
    { label: 'Pemasukan', icon: ArrowDownCircle, color: 'text-[hsl(var(--income))]', bg: 'bg-[hsl(var(--income)/0.1)]', path: '/transactions?type=income' },
    { label: 'Pengeluaran', icon: ArrowUpCircle, color: 'text-[hsl(var(--expense))]', bg: 'bg-[hsl(var(--expense)/0.1)]', path: '/transactions?type=expense' },
    { label: 'Transfer', icon: ArrowRightLeft, color: 'text-primary', bg: 'bg-primary/10', path: '/wallets' },
    { label: 'Target', icon: Target, color: 'text-accent', bg: 'bg-accent/10', path: '/goals' },
    { label: 'Berulang', icon: RefreshCw, color: 'text-primary', bg: 'bg-primary/10', path: '/recurring' },
    { label: 'Hutang', icon: CreditCard, color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning)/0.1)]', path: '/debts' },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl border-t pb-8">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display">Aksi Cepat</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => go(a.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover-lift"
            >
              <span className={`h-12 w-12 rounded-2xl flex items-center justify-center ${a.bg}`}>
                <a.icon className={`h-6 w-6 ${a.color}`} />
              </span>
              <span className="text-xs font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
