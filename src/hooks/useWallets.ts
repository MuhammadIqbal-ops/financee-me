import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  initial_balance: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletInput {
  name: string;
  icon?: string;
  color?: string;
  initial_balance?: number;
}

export function useWallets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');
      if (error) throw error;
      return data as Wallet[];
    },
    enabled: !!user,
  });
}

export function useWalletBalances() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['walletBalances', user?.id],
    queryFn: async () => {
      // Get all wallets
      const { data: wallets, error: wErr } = await supabase
        .from('wallets')
        .select('*')
        .order('is_default', { ascending: false });
      if (wErr) throw wErr;

      // Get all transactions grouped by wallet
      const { data: transactions, error: tErr } = await supabase
        .from('transactions')
        .select('wallet_id, amount, type');
      if (tErr) throw tErr;

      return (wallets as Wallet[]).map((w) => {
        const walletTxns = (transactions || []).filter((t: any) => t.wallet_id === w.id);
        const balance = walletTxns.reduce((acc: number, t: any) => {
          return acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
        }, w.initial_balance);
        return { ...w, balance };
      });
    },
    enabled: !!user,
  });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: WalletInput) => {
      const { data, error } = await supabase
        .from('wallets')
        .insert({ user_id: user!.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalances'] });
      toast.success('Dompet berhasil ditambahkan!');
    },
    onError: (e: Error) => toast.error('Gagal menambahkan dompet: ' + e.message),
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: WalletInput & { id: string }) => {
      const { data, error } = await supabase
        .from('wallets')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalances'] });
      toast.success('Dompet berhasil diperbarui!');
    },
    onError: (e: Error) => toast.error('Gagal memperbarui dompet: ' + e.message),
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalances'] });
      toast.success('Dompet berhasil dihapus!');
    },
    onError: (e: Error) => toast.error('Gagal menghapus dompet: ' + e.message),
  });
}
