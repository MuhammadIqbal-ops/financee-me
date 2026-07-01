import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Budget } from '@/types/database';
import { toast } from 'sonner';
import { optimisticInsert, optimisticUpdate, optimisticDelete, rollback, tempId, Snapshot } from '@/lib/optimistic';

export interface BudgetInput {
  category_id: string;
  amount: number;
  month: number;
  year: number;
}

export function useBudgets(month: number, year: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budgets', user?.id, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select(`*, category:categories(*)`)
        .eq('month', month)
        .eq('year', year);
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: BudgetInput) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert({ user_id: user!.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      const optimistic = { id: tempId(), user_id: user?.id, ...input, category: null };
      const snap = await optimisticInsert(queryClient, ['budgets'], optimistic as any);
      return { snap };
    },
    onError: (error: Error, _v, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal menambahkan anggaran: ' + error.message);
    },
    onSuccess: () => toast.success('Anggaran berhasil ditambahkan!'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<BudgetInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...input }) => {
      const snap = await optimisticUpdate(queryClient, ['budgets'], id, input as any);
      return { snap };
    },
    onError: (error: Error, _v, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal memperbarui anggaran: ' + error.message);
    },
    onSuccess: () => toast.success('Anggaran berhasil diperbarui!'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      const snap = await optimisticDelete(queryClient, ['budgets'], id);
      return { snap };
    },
    onError: (error: Error, _id, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal menghapus anggaran: ' + error.message);
    },
    onSuccess: () => toast.success('Anggaran berhasil dihapus!'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
