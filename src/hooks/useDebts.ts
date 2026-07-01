import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logUserActivity } from '@/lib/activityLogger';
import { optimisticInsert, optimisticUpdate, optimisticDelete, rollback, tempId, Snapshot } from '@/lib/optimistic';

export type DebtType = 'payable' | 'receivable';
export type DebtStatus = 'unpaid' | 'partial' | 'paid';

export interface Debt {
  id: string;
  user_id: string;
  person_name: string;
  amount: number;
  type: DebtType;
  status: DebtStatus;
  paid_amount: number;
  due_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebtInput {
  person_name: string;
  amount: number;
  type: DebtType;
  due_date?: string | null;
  note?: string;
}

export function useDebts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['debts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('debts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Debt[];
    },
    enabled: !!user,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: DebtInput) => {
      const { data, error } = await supabase.from('debts').insert({ user_id: user!.id, ...input }).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      const optimistic = { id: tempId(), user_id: user?.id, status: 'unpaid', paid_amount: 0, ...input };
      const snap = await optimisticInsert(queryClient, ['debts'], optimistic as any);
      return { snap };
    },
    onError: (e: Error, _v, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal: ' + e.message);
    },
    onSuccess: (data) => {
      toast.success('Hutang/piutang berhasil ditambahkan!');
      logUserActivity(user!.id, 'create', 'debt', data.id, { name: data.person_name, type: data.type });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<DebtInput> & { id: string; paid_amount?: number; status?: DebtStatus }) => {
      const { data, error } = await supabase.from('debts').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...input }) => {
      const snap = await optimisticUpdate(queryClient, ['debts'], id, input as any);
      return { snap };
    },
    onError: (e: Error, _v, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal: ' + e.message);
    },
    onSuccess: (data) => {
      toast.success('Berhasil diperbarui!');
      logUserActivity(user!.id, 'update', 'debt', data.id, { name: data.person_name });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      const snap = await optimisticDelete(queryClient, ['debts'], id);
      return { snap };
    },
    onError: (e: Error, _id, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal: ' + e.message);
    },
    onSuccess: (id) => {
      toast.success('Berhasil dihapus!');
      logUserActivity(user!.id, 'delete', 'debt', id);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });
}
