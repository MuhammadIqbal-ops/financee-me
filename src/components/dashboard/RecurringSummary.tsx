import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRecurringTransactions, getFrequencyLabel } from '@/hooks/useRecurringTransactions';
import { formatCurrency } from '@/lib/currency';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface RecurringSummaryProps {
  currency?: string;
}

export function RecurringSummary({ currency = 'IDR' }: RecurringSummaryProps) {
  const navigate = useNavigate();
  const { data: recurring, isLoading } = useRecurringTransactions();

  const activeItems = (recurring || []).filter((r) => r.is_active).slice(0, 3);

  if (isLoading) return null;

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Transaksi Berulang</CardTitle>
        <button
          onClick={() => navigate('/recurring')}
          className="text-xs text-primary hover:underline"
        >
          Kelola
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <RefreshCw size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Belum ada transaksi berulang</p>
          </div>
        ) : (
          activeItems.map((rt) => (
            <div key={rt.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-muted/50">
              <div className="flex items-center gap-2.5 min-w-0">
                {rt.type === 'income' ? (
                  <TrendingUp size={16} className="text-[hsl(var(--income))] shrink-0" />
                ) : (
                  <TrendingDown size={16} className="text-[hsl(var(--expense))] shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {rt.category?.name || rt.note || 'Tanpa Kategori'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {getFrequencyLabel(rt.frequency)}
                    </Badge>
                    <span>· {format(new Date(rt.next_run_date), 'd MMM', { locale: localeId })}</span>
                  </div>
                </div>
              </div>
              <span className={`text-sm font-semibold shrink-0 ml-2 ${rt.type === 'income' ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'}`}>
                {rt.type === 'income' ? '+' : '-'}{formatCurrency(rt.amount, currency)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
