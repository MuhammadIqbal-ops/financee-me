import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '@/types/database';
import { formatCurrency } from '@/lib/currency';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  chartAxisTick,
  chartGridStroke,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from '@/lib/chartTheme';

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
        if (t.type === 'income') existing.income += Number(t.amount);
        else existing.expense += Number(t.amount);
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
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
        <XAxis
          dataKey="date"
          tick={chartAxisTick}
          stroke={chartGridStroke}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={20}
        />
        <YAxis
          tick={chartAxisTick}
          stroke={chartGridStroke}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
            return `${v}`;
          }}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
          contentStyle={chartTooltipStyle}
          itemStyle={chartTooltipItemStyle}
          labelStyle={chartTooltipLabelStyle}
          cursor={{ stroke: 'hsl(var(--primary) / 0.35)', strokeWidth: 1 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', paddingTop: 8 }}
          iconType="circle"
        />
        <Line
          type="monotone"
          dataKey="Pemasukan"
          stroke="hsl(var(--income))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="Pengeluaran"
          stroke="hsl(var(--expense))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="Saldo"
          stroke="url(#balanceGradient)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
