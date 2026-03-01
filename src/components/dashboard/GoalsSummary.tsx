import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGoals } from '@/hooks/useGoals';
import { formatCurrency } from '@/lib/currency';
import { Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GoalsSummaryProps {
  currency?: string;
}

export function GoalsSummary({ currency = 'IDR' }: GoalsSummaryProps) {
  const navigate = useNavigate();
  const { data: goals, isLoading } = useGoals();

  const activeGoals = (goals || [])
    .filter((g) => {
      const pct = g.target_amount > 0 ? ((g.current_amount || 0) / g.target_amount) * 100 : 0;
      return pct < 100;
    })
    .slice(0, 3);

  if (isLoading) return null;

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Target Tabungan</CardTitle>
        <button
          onClick={() => navigate('/goals')}
          className="text-xs text-primary hover:underline"
        >
          Lihat Semua
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Target size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Belum ada target</p>
          </div>
        ) : (
          activeGoals.map((goal) => {
            const current = goal.current_amount || 0;
            const pct = goal.target_amount > 0 ? (current / goal.target_amount) * 100 : 0;

            return (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground truncate mr-2">{goal.name}</span>
                  <span className="text-xs font-semibold text-primary">{Math.round(pct)}%</span>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-2 bg-muted" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(current, currency)}</span>
                  <span>/ {formatCurrency(goal.target_amount, currency)}</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
