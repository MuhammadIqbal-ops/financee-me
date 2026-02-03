import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CategoryComparison {
  categoryName: string;
  categoryColor: string;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'same' | 'new';
}

interface MonthlyComparison {
  currentMonthTotal: number;
  previousMonthTotal: number;
  totalPercentageChange: number;
  totalTrend: 'up' | 'down' | 'same';
  categoryComparisons: CategoryComparison[];
}

export function useMonthlyComparison(currentMonth: number, currentYear: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthlyComparison', user?.id, currentMonth, currentYear],
    queryFn: async (): Promise<MonthlyComparison> => {
      // Calculate previous month
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = currentYear - 1;
      }

      // Current month date range
      const currentStartDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
      const currentEndDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

      // Previous month date range
      const prevStartDate = new Date(prevYear, prevMonth - 1, 1).toISOString().split('T')[0];
      const prevEndDate = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

      // Fetch current month expenses
      const { data: currentData, error: currentError } = await supabase
        .from('transactions')
        .select(`
          amount,
          category:categories(name, color)
        `)
        .eq('type', 'expense')
        .gte('date', currentStartDate)
        .lte('date', currentEndDate);

      if (currentError) throw currentError;

      // Fetch previous month expenses
      const { data: prevData, error: prevError } = await supabase
        .from('transactions')
        .select(`
          amount,
          category:categories(name, color)
        `)
        .eq('type', 'expense')
        .gte('date', prevStartDate)
        .lte('date', prevEndDate);

      if (prevError) throw prevError;

      // Aggregate by category for current month
      const currentByCategory = new Map<string, { amount: number; color: string }>();
      let currentMonthTotal = 0;

      (currentData || []).forEach((t: any) => {
        const categoryName = t.category?.name || 'Lainnya';
        const categoryColor = t.category?.color || '#6b7280';
        const amount = Number(t.amount);
        currentMonthTotal += amount;

        const existing = currentByCategory.get(categoryName);
        if (existing) {
          existing.amount += amount;
        } else {
          currentByCategory.set(categoryName, { amount, color: categoryColor });
        }
      });

      // Aggregate by category for previous month
      const prevByCategory = new Map<string, { amount: number; color: string }>();
      let previousMonthTotal = 0;

      (prevData || []).forEach((t: any) => {
        const categoryName = t.category?.name || 'Lainnya';
        const categoryColor = t.category?.color || '#6b7280';
        const amount = Number(t.amount);
        previousMonthTotal += amount;

        const existing = prevByCategory.get(categoryName);
        if (existing) {
          existing.amount += amount;
        } else {
          prevByCategory.set(categoryName, { amount, color: categoryColor });
        }
      });

      // Compare categories
      const allCategories = new Set([...currentByCategory.keys(), ...prevByCategory.keys()]);
      const categoryComparisons: CategoryComparison[] = [];

      allCategories.forEach((categoryName) => {
        const current = currentByCategory.get(categoryName);
        const prev = prevByCategory.get(categoryName);

        const currentAmount = current?.amount || 0;
        const previousAmount = prev?.amount || 0;
        const color = current?.color || prev?.color || '#6b7280';

        let percentageChange = 0;
        let trend: 'up' | 'down' | 'same' | 'new' = 'same';

        if (previousAmount === 0 && currentAmount > 0) {
          trend = 'new';
          percentageChange = 100;
        } else if (previousAmount > 0) {
          percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100;
          if (percentageChange > 5) {
            trend = 'up';
          } else if (percentageChange < -5) {
            trend = 'down';
          } else {
            trend = 'same';
          }
        }

        categoryComparisons.push({
          categoryName,
          categoryColor: color,
          currentAmount,
          previousAmount,
          percentageChange,
          trend,
        });
      });

      // Sort by absolute percentage change (most significant first)
      categoryComparisons.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));

      // Calculate total comparison
      let totalPercentageChange = 0;
      let totalTrend: 'up' | 'down' | 'same' = 'same';

      if (previousMonthTotal > 0) {
        totalPercentageChange = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
        if (totalPercentageChange > 5) {
          totalTrend = 'up';
        } else if (totalPercentageChange < -5) {
          totalTrend = 'down';
        }
      }

      return {
        currentMonthTotal,
        previousMonthTotal,
        totalPercentageChange,
        totalTrend,
        categoryComparisons,
      };
    },
    enabled: !!user,
  });
}
