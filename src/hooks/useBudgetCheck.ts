import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';

interface BudgetCheckResult {
  isOverBudget: boolean;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentageUsed: number;
}

export async function checkBudgetAfterTransaction(
  categoryId: string | null,
  transactionDate: string,
  currency: string = 'IDR'
): Promise<BudgetCheckResult | null> {
  if (!categoryId) return null;

  try {
    // Get the month and year from transaction date
    const date = new Date(transactionDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Check if there's a budget for this category
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select(`
        amount,
        category:categories(name, type)
      `)
      .eq('category_id', categoryId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (budgetError) throw budgetError;
    if (!budget) return null;

    // Only check expense categories
    const category = budget.category as { name: string; type: string } | null;
    if (!category || category.type !== 'expense') return null;

    // Calculate total spending for this category this month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('category_id', categoryId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    if (txError) throw txError;

    const spentAmount = (transactions || []).reduce((sum, t) => sum + Number(t.amount), 0);
    const budgetAmount = Number(budget.amount);
    const percentageUsed = (spentAmount / budgetAmount) * 100;

    const result: BudgetCheckResult = {
      isOverBudget: spentAmount > budgetAmount,
      categoryName: category.name,
      budgetAmount,
      spentAmount,
      percentageUsed,
    };

    // Show toast notification based on budget status
    if (percentageUsed >= 100) {
      toast.error(
        `⚠️ Anggaran ${category.name} terlampaui!`,
        {
          description: `Pengeluaran ${formatCurrency(spentAmount, currency)} dari anggaran ${formatCurrency(budgetAmount, currency)} (${percentageUsed.toFixed(0)}%)`,
          duration: 6000,
        }
      );
    } else if (percentageUsed >= 80) {
      toast.warning(
        `⚡ Anggaran ${category.name} hampir habis!`,
        {
          description: `Pengeluaran ${formatCurrency(spentAmount, currency)} dari anggaran ${formatCurrency(budgetAmount, currency)} (${percentageUsed.toFixed(0)}%)`,
          duration: 5000,
        }
      );
    }

    return result;
  } catch (error) {
    console.error('Error checking budget:', error);
    return null;
  }
}
