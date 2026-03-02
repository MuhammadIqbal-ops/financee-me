import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });
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
      const { data, error } = await supabase
        .from('debts')
        .insert({ user_id: user!.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Hutang/piutang berhasil ditambahkan!');
    },
    onError: (e: Error) => toast.error('Gagal: ' + e.message),
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<DebtInput> & { id: string; paid_amount?: number; status?: DebtStatus }) => {
      const { data, error } = await supabase
        .from('debts')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Berhasil diperbarui!');
    },
    onError: (e: Error) => toast.error('Gagal: ' + e.message),
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Berhasil dihapus!');
    },
    onError: (e: Error) => toast.error('Gagal: ' + e.message),
  });
}
