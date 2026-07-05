import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction } from '@/types/database';
import { formatCurrency } from '@/lib/currency';
import {
  CHART_COLORS,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from '@/lib/chartTheme';

interface ExpensePieChartProps {
  transactions: Transaction[];
  currency?: string;
}

export function ExpensePieChart({ transactions, currency = 'IDR' }: ExpensePieChartProps) {
  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const categoryTotals = new Map<string, { name: string; value: number; color?: string }>();

    expenses.forEach((t) => {
      const categoryName = t.category?.name || 'Lainnya';
      const categoryColor = t.category?.color;
      const existing = categoryTotals.get(categoryName);
      if (existing) existing.value += Number(t.amount);
      else categoryTotals.set(categoryName, { name: categoryName, value: Number(t.amount), color: categoryColor });
    });

    return Array.from(categoryTotals.values()).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Belum ada data pengeluaran</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value, currency)}
            contentStyle={chartTooltipStyle}
            itemStyle={chartTooltipItemStyle}
            labelStyle={chartTooltipLabelStyle}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Pengeluaran</p>
        <p className="text-xl font-bold text-gradient-primary">{formatCurrency(total, currency)}</p>
      </div>
    </div>
  );
}
