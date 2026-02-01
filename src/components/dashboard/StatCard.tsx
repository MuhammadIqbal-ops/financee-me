import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  variant?: 'income' | 'expense' | 'balance' | 'default';
}

export function StatCard({ title, value, icon, trend, trendUp, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    income: 'stat-income',
    expense: 'stat-expense',
    balance: 'stat-balance',
    default: '',
  };

  return (
    <Card className={cn('shadow-card hover:shadow-elevated transition-shadow', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className={cn(
                'text-xs font-medium',
                trendUp ? 'text-success' : 'text-destructive'
              )}>
                {trend}
              </p>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-xl',
            variant === 'income' && 'bg-income/10 text-income',
            variant === 'expense' && 'bg-expense/10 text-expense',
            variant === 'balance' && 'bg-primary/10 text-primary',
            variant === 'default' && 'bg-muted text-muted-foreground'
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
