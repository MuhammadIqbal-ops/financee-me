import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebts } from '@/hooks/useDebts';
import { formatCurrency } from '@/lib/currency';
import { CreditCard, HandCoins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DebtSummaryProps {
  currency?: string;
}

export function DebtSummary({ currency = 'IDR' }: DebtSummaryProps) {
  const navigate = useNavigate();
  const { data: debts, isLoading } = useDebts();

  if (isLoading) return null;

  const activeDebts = (debts || []).filter(d => d.status !== 'paid');
  const totalPayable = activeDebts.filter(d => d.type === 'payable').reduce((s, d) => s + d.amount - d.paid_amount, 0);
  const totalReceivable = activeDebts.filter(d => d.type === 'receivable').reduce((s, d) => s + d.amount - d.paid_amount, 0);
  const overdueCount = activeDebts.filter(d => d.due_date && new Date(d.due_date) < new Date()).length;

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Hutang & Piutang</CardTitle>
        <button onClick={() => navigate('/debts')} className="text-xs text-primary hover:underline">Kelola</button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!activeDebts.length ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <CreditCard size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Tidak ada hutang/piutang aktif</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-muted/50">
              <div className="flex items-center gap-2.5">
                <CreditCard size={16} className="text-[hsl(var(--expense))]" />
                <span className="text-sm text-foreground">Hutang</span>
              </div>
              <span className="text-sm font-semibold text-[hsl(var(--expense))]">{formatCurrency(totalPayable, currency)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-muted/50">
              <div className="flex items-center gap-2.5">
                <HandCoins size={16} className="text-[hsl(var(--income))]" />
                <span className="text-sm text-foreground">Piutang</span>
              </div>
              <span className="text-sm font-semibold text-[hsl(var(--income))]">{formatCurrency(totalReceivable, currency)}</span>
            </div>
            {overdueCount > 0 && (
              <p className="text-xs text-destructive font-medium px-1">⚠ {overdueCount} item jatuh tempo</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
