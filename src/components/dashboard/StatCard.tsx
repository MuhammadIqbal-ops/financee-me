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
    <Card className={cn('hover-lift overflow-hidden', variantStyles[variant])}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trendUp ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'
                )}
              >
                {trend}
              </p>
            )}
          </div>
          <div
            className={cn(
              'shrink-0 p-2.5 sm:p-3 rounded-2xl',
              variant === 'income' && 'bg-[hsl(var(--income)/0.12)] text-[hsl(var(--income))]',
              variant === 'expense' && 'bg-[hsl(var(--expense)/0.12)] text-[hsl(var(--expense))]',
              variant === 'balance' && 'gradient-primary text-primary-foreground shadow-glow',
              variant === 'default' && 'bg-muted text-muted-foreground'
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
