import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction, Category } from '@/types/database';
import { formatCurrency } from '@/lib/currency';

interface ExpensePieChartProps {
  transactions: Transaction[];
  currency?: string;
}

const COLORS = [
  'hsl(168, 80%, 35%)',
  'hsl(38, 95%, 55%)',
  'hsl(240, 60%, 60%)',
  'hsl(320, 70%, 55%)',
  'hsl(25, 90%, 55%)',
  'hsl(280, 65%, 55%)',
  'hsl(0, 72%, 51%)',
  'hsl(200, 70%, 50%)',
];

export function ExpensePieChart({ transactions, currency = 'IDR' }: ExpensePieChartProps) {
  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const categoryTotals = new Map<string, { name: string; value: number; color: string }>();

    expenses.forEach((t) => {
      const categoryName = t.category?.name || 'Lainnya';
      const categoryColor = t.category?.color || '#6b7280';
      const existing = categoryTotals.get(categoryName);
      
      if (existing) {
        existing.value += Number(t.amount);
      } else {
        categoryTotals.set(categoryName, {
          name: categoryName,
          value: Number(t.amount),
          color: categoryColor,
        });
      }
    });

    return Array.from(categoryTotals.values()).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Belum ada data pengeluaran</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg">Pengeluaran per Kategori</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value, currency)}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend
              formatter={(value, entry: any) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(total, currency)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
