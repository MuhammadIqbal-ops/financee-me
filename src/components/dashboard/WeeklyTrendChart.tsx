import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/currency';
import { TrendingDown } from 'lucide-react';

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
      if (t.type === 'expense') {
        weeks[weekIdx].expense += Number(t.amount);
      } else {
        weeks[weekIdx].income += Number(t.amount);
      }
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
      <CardContent>
        {weeklyData.length === 0 || maxExpense === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Belum ada data</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
                  return v;
                }}
                width={45}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value, currency),
                  name === 'expense' ? 'Pengeluaran' : 'Pemasukan',
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} name="expense" />
              <Bar dataKey="income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} name="income" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
