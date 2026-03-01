import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/currency';
import { Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface BudgetSummaryProps {
  month: number;
  year: number;
  currency?: string;
}

export function BudgetSummary({ month, year, currency = 'IDR' }: BudgetSummaryProps) {
  const navigate = useNavigate();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets(month, year);
  const { data: transactions } = useTransactions(month, year);

  const budgetProgress = useMemo(() => {
    if (!budgets || !transactions) return [];

    return budgets
      .map((budget) => {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.category_id === budget.category_id)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const categoryName = budget.category?.name || 'Tanpa Kategori';
        const categoryColor = budget.category?.color || '#6b7280';

        return {
          id: budget.id,
          name: categoryName,
          color: categoryColor,
          spent,
          limit: budget.amount,
          percentage: Math.min(percentage, 100),
          overBudget: percentage > 100,
        };
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }, [budgets, transactions]);

  if (budgetsLoading) return null;

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Anggaran Bulan Ini</CardTitle>
        <button
          onClick={() => navigate('/reports')}
          className="text-xs text-primary hover:underline"
        >
          Lihat Semua
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgetProgress.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Wallet size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Belum ada anggaran</p>
          </div>
        ) : (
          budgetProgress.map((b) => {
            const statusColor =
              b.percentage >= 90
                ? 'text-destructive'
                : b.percentage >= 70
                ? 'text-[hsl(var(--warning))]'
                : 'text-[hsl(var(--success))]';

            const progressClass =
              b.percentage >= 90
                ? 'progress-danger'
                : b.percentage >= 70
                ? 'progress-warning'
                : 'progress-safe';

            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="font-medium text-foreground">{b.name}</span>
                  </div>
                  <span className={`text-xs font-semibold ${statusColor}`}>
                    {Math.round(b.percentage)}%
                  </span>
                </div>
                <Progress
                  value={b.percentage}
                  className="h-2 bg-muted"
                  indicatorClassName={progressClass}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(b.spent, currency)}</span>
                  <span>/ {formatCurrency(b.limit, currency)}</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
