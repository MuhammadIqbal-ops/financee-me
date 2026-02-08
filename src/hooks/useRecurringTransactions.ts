import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: 'income' | 'expense';
  frequency: RecurrenceFrequency;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'income' | 'expense';
  };
}

export interface RecurringTransactionInput {
  amount: number;
  type: 'income' | 'expense';
  category_id: string | null;
  frequency: RecurrenceFrequency;
  start_date: string;
  end_date?: string | null;
  note?: string;
}

export function useRecurringTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurringTransactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          category:categories(id, name, icon, color, type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RecurringTransaction[];
    },
    enabled: !!user,
  });
}

export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: RecurringTransactionInput) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          user_id: user!.id,
          ...input,
          next_run_date: input.start_date,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      toast.success('Transaksi berulang berhasil ditambahkan!');
    },
    onError: (error: Error) => {
      toast.error('Gagal menambahkan transaksi berulang: ' + error.message);
    },
  });
}

export function useUpdateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: RecurringTransactionInput & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      toast.success('Transaksi berulang berhasil diperbarui!');
    },
    onError: (error: Error) => {
      toast.error('Gagal memperbarui transaksi berulang: ' + error.message);
    },
  });
}

export function useToggleRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      toast.success(variables.is_active ? 'Transaksi berulang diaktifkan!' : 'Transaksi berulang dinonaktifkan!');
    },
    onError: (error: Error) => {
      toast.error('Gagal mengubah status: ' + error.message);
    },
  });
}

export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      toast.success('Transaksi berulang berhasil dihapus!');
    },
    onError: (error: Error) => {
      toast.error('Gagal menghapus transaksi berulang: ' + error.message);
    },
  });
}

export function getFrequencyLabel(frequency: RecurrenceFrequency): string {
  const labels: Record<RecurrenceFrequency, string> = {
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
  };
  return labels[frequency];
}
