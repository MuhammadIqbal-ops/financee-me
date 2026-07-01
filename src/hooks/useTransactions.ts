import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Transaction, TransactionType } from '@/types/database';
import { toast } from 'sonner';
import { checkBudgetAfterTransaction } from '@/hooks/useBudgetCheck';
import { logUserActivity } from '@/lib/activityLogger';
import { optimisticInsert, optimisticUpdate, optimisticDelete, rollback, tempId, Snapshot } from '@/lib/optimistic';
export interface TransactionInput {
  amount: number;
  type: TransactionType;
  category_id: string | null;
  date: string;
  note?: string;
  wallet_id?: string | null;
  receipt_url?: string | null;
  currency?: string | null;
}

export function useTransactions(month?: number, year?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id, month, year],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false });

      if (month && year) {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user!.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return { transaction: data, input };
    },
    onMutate: async (input) => {
      const optimistic = {
        id: tempId(),
        user_id: user?.id,
        ...input,
        category: null,
        created_at: new Date().toISOString(),
      };
      const snap = await optimisticInsert(queryClient, ['transactions'], optimistic as any);
      return { snap };
    },
    onError: (error: Error, _vars, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal menambahkan transaksi: ' + error.message);
    },
    onSuccess: async ({ transaction, input }) => {
      toast.success('Transaksi berhasil ditambahkan!');
      logUserActivity(user!.id, 'create', 'transaction', transaction.id, { type: input.type, amount: input.amount, note: input.note });
      if (input.type === 'expense' && input.category_id) {
        await checkBudgetAfterTransaction(input.category_id, input.date, profile?.currency || 'IDR');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyStats'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalances'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ id, ...input }: TransactionInput & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { transaction: data, input };
    },
    onMutate: async ({ id, ...input }) => {
      const snap = await optimisticUpdate(queryClient, ['transactions'], id, input as any);
      return { snap };
    },
    onError: (error: Error, _vars, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal memperbarui transaksi: ' + error.message);
    },
    onSuccess: async ({ transaction, input }) => {
      toast.success('Transaksi berhasil diperbarui!');
      logUserActivity(user!.id, 'update', 'transaction', transaction.id, { type: input.type, amount: input.amount });
      if (input.type === 'expense' && input.category_id) {
        await checkBudgetAfterTransaction(input.category_id, input.date, profile?.currency || 'IDR');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyStats'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalances'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyStats'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalances'] });
      toast.success('Transaksi berhasil dihapus!');
      logUserActivity(user!.id, 'delete', 'transaction', id);
    },
    onError: (error: Error) => {
      toast.error('Gagal menghapus transaksi: ' + error.message);
    },
  });
}

export function useMonthlyStats(month: number, year: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthlyStats', user?.id, month, year],
    queryFn: async () => {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type, currency')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Get exchange rates for conversion
      const { data: rates } = await supabase
        .from('exchange_rates')
        .select('*');

      const userCurrency = (await supabase.from('profiles').select('currency').eq('user_id', user!.id).single()).data?.currency || 'IDR';

      const stats = (data || []).reduce(
        (acc, t) => {
          let amount = Number(t.amount);
          // Convert if different currency
          if (t.currency && t.currency !== userCurrency && rates) {
            const rate = rates.find(
              (r: any) => r.base_currency === t.currency && r.target_currency === userCurrency
            );
            if (rate) amount = amount * Number(rate.rate);
          }
          if (t.type === 'income') {
            acc.totalIncome += amount;
          } else {
            acc.totalExpense += amount;
          }
          return acc;
        },
        { totalIncome: 0, totalExpense: 0, balance: 0 }
      );

      stats.balance = stats.totalIncome - stats.totalExpense;
      return stats;
    },
    enabled: !!user,
  });
}
