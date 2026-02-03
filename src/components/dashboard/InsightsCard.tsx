import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMonthlyComparison } from '@/hooks/useMonthlyComparison';
import { formatCurrency } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface InsightsCardProps {
  month: number;
  year: number;
  currency?: string;
}

export function InsightsCard({ month, year, currency = 'IDR' }: InsightsCardProps) {
  const { data: comparison, isLoading } = useMonthlyComparison(month, year);

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Insight Otomatis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparison || comparison.categoryComparisons.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Insight Otomatis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Belum ada data untuk dibandingkan
          </p>
        </CardContent>
      </Card>
    );
  }

  const significantChanges = comparison.categoryComparisons.filter(
    (c) => c.trend === 'up' || c.trend === 'down'
  ).slice(0, 3);

  const getTrendIcon = (trend: 'up' | 'down' | 'same' | 'new') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-expense" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-income" />;
      case 'new':
        return <AlertTriangle className="w-4 h-4 text-accent" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendText = (c: typeof significantChanges[0]) => {
    const absChange = Math.abs(c.percentageChange).toFixed(0);
    if (c.trend === 'up') {
      return `naik ${absChange}%`;
    } else if (c.trend === 'down') {
      return `turun ${absChange}%`;
    } else if (c.trend === 'new') {
      return 'baru bulan ini';
    }
    return 'stabil';
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Insight Otomatis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Comparison */}
        <div className={cn(
          'p-4 rounded-lg border-l-4',
          comparison.totalTrend === 'up' && 'bg-expense/5 border-expense',
          comparison.totalTrend === 'down' && 'bg-income/5 border-income',
          comparison.totalTrend === 'same' && 'bg-muted border-muted-foreground'
        )}>
          <div className="flex items-start gap-3">
            {comparison.totalTrend === 'up' ? (
              <AlertTriangle className="w-5 h-5 text-expense mt-0.5" />
            ) : comparison.totalTrend === 'down' ? (
              <CheckCircle className="w-5 h-5 text-income mt-0.5" />
            ) : (
              <Minus className="w-5 h-5 text-muted-foreground mt-0.5" />
            )}
            <div>
              <p className="font-medium text-foreground">
                {comparison.totalTrend === 'up'
                  ? 'Pengeluaran meningkat!'
                  : comparison.totalTrend === 'down'
                  ? 'Pengeluaran menurun!'
                  : 'Pengeluaran stabil'}
              </p>
              <p className="text-sm text-muted-foreground">
                Total pengeluaran bulan ini {formatCurrency(comparison.currentMonthTotal, currency)}
                {comparison.previousMonthTotal > 0 && (
                  <span>
                    , {comparison.totalTrend === 'up' ? 'naik' : comparison.totalTrend === 'down' ? 'turun' : 'sama dengan'}
                    {' '}{Math.abs(comparison.totalPercentageChange).toFixed(0)}% dari bulan lalu
                    {' '}({formatCurrency(comparison.previousMonthTotal, currency)})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Category Changes */}
        {significantChanges.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Perubahan signifikan per kategori:
            </p>
            {significantChanges.map((c) => (
              <div
                key={c.categoryName}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.categoryColor }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {c.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(c.trend)}
                  <span className={cn(
                    'text-sm font-medium',
                    c.trend === 'up' && 'text-expense',
                    c.trend === 'down' && 'text-income'
                  )}>
                    {getTrendText(c)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {significantChanges.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Tidak ada perubahan signifikan per kategori bulan ini
          </p>
        )}
      </CardContent>
    </Card>
  );
}
