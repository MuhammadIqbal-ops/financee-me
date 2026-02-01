import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '@/types/database';
import { formatCurrency } from '@/lib/currency';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface CashFlowChartProps {
  transactions: Transaction[];
  month: number;
  year: number;
  currency?: string;
}

export function CashFlowChart({ transactions, month, year, currency = 'IDR' }: CashFlowChartProps) {
  const data = useMemo(() => {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const dailyData = new Map<string, { income: number; expense: number }>();

    days.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      dailyData.set(key, { income: 0, expense: 0 });
    });

    transactions.forEach((t) => {
      const key = t.date;
      const existing = dailyData.get(key);
      if (existing) {
        if (t.type === 'income') {
          existing.income += Number(t.amount);
        } else {
          existing.expense += Number(t.amount);
        }
      }
    });

    let cumulativeBalance = 0;
    return Array.from(dailyData.entries()).map(([date, values]) => {
      cumulativeBalance += values.income - values.expense;
      return {
        date: format(parseISO(date), 'd MMM', { locale: id }),
        Pemasukan: values.income,
        Pengeluaran: values.expense,
        Saldo: cumulativeBalance,
      };
    });
  }, [transactions, month, year]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg">Cash Flow Bulanan</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Pemasukan"
              stroke="hsl(var(--income))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Pengeluaran"
              stroke="hsl(var(--expense))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Saldo"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
