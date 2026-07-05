import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/currency';
import { TrendingDown } from 'lucide-react';
import {
  chartAxisTick,
  chartGridStroke,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from '@/lib/chartTheme';

interface WeeklyTrendChartProps {
  month: number;
  year: number;
  currency: string;
}

export function WeeklyTrendChart({ month, year, currency }: WeeklyTrendChartProps) {
  const { data: transactions } = useTransactions(month, year);

  const weeklyData = useMemo(() => {
    if (!transactions) return [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const weeks: { name: string; expense: number; income: number }[] = [];

    for (let w = 0; w < Math.ceil(daysInMonth / 7); w++) {
      const startDay = w * 7 + 1;
      const endDay = Math.min(startDay + 6, daysInMonth);
      weeks.push({ name: `${startDay}-${endDay}`, expense: 0, income: 0 });
    }

    transactions.forEach((t) => {
      const day = new Date(t.date).getDate();
      const weekIdx = Math.min(Math.floor((day - 1) / 7), weeks.length - 1);
      if (t.type === 'expense') weeks[weekIdx].expense += Number(t.amount);
      else weeks[weekIdx].income += Number(t.amount);
    });

    return weeks;
  }, [transactions, month, year]);

  const maxExpense = Math.max(...weeklyData.map((w) => w.expense), 0);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingDown size={18} className="text-[hsl(var(--expense))]" />
          Tren Mingguan
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {weeklyData.length === 0 || maxExpense === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Belum ada data</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barGap={4} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
              <XAxis dataKey="name" tick={chartAxisTick} tickLine={false} axisLine={false} />
              <YAxis
                tick={chartAxisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
                  return v;
                }}
                width={42}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value, currency),
                  name === 'expense' ? 'Pengeluaran' : 'Pemasukan',
                ]}
                contentStyle={chartTooltipStyle}
                itemStyle={chartTooltipItemStyle}
                labelStyle={chartTooltipLabelStyle}
                cursor={{ fill: 'hsl(var(--primary) / 0.06)' }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                formatter={(v) => (
                  <span className="text-xs text-muted-foreground">
                    {v === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                  </span>
                )}
              />
              <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[6, 6, 0, 0]} name="expense" />
              <Bar dataKey="income" fill="hsl(var(--income))" radius={[6, 6, 0, 0]} name="income" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
