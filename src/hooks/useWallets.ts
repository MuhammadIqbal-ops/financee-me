import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logUserActivity } from '@/lib/activityLogger';
import { optimisticInsert, optimisticUpdate, optimisticDelete, rollback, tempId, Snapshot } from '@/lib/optimistic';

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
      const { data, error } = await supabase.from('wallets').select('*').order('is_default', { ascending: false }).order('name');
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
      const { data: wallets, error: wErr } = await supabase.from('wallets').select('*').order('is_default', { ascending: false });
      if (wErr) throw wErr;
      const { data: transactions, error: tErr } = await supabase.from('transactions').select('wallet_id, amount, type');
      if (tErr) throw tErr;
      const { data: transfers, error: trErr } = await supabase.from('wallet_transfers').select('from_wallet_id, to_wallet_id, amount');
      if (trErr) throw trErr;

      return (wallets as Wallet[]).map((w) => {
        const walletTxns = (transactions || []).filter((t: any) => t.wallet_id === w.id);
        let balance = walletTxns.reduce((acc: number, t: any) => {
          return acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
        }, w.initial_balance);
        (transfers || []).forEach((tr: any) => {
          if (tr.from_wallet_id === w.id) balance -= Number(tr.amount);
          if (tr.to_wallet_id === w.id) balance += Number(tr.amount);
        });
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
      const { data, error } = await supabase.from('wallets').insert({ user_id: user!.id, ...input }).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      const optimistic = {
        id: tempId(),
        user_id: user?.id,
        icon: 'wallet',
        color: '#10b981',
        initial_balance: 0,
        is_default: false,
        ...input,
      };
      const snap = await optimisticInsert(queryClient, ['wallets'], optimistic as any);
      return { snap };
    },
    onError: (e: Error, _v, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal menambahkan dompet: ' + e.message);
    },
    onSuccess: (data) => {
      toast.success('Dompet berhasil ditambahkan!');
      logUserActivity(user!.id, 'create', 'wallet', data.id, { name: data.name });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalances'] });
    },
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...input }: WalletInput & { id: string }) => {
      const { data, error } = await supabase.from('wallets').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...input }) => {
      const snap = await optimisticUpdate(queryClient, ['wallets'], id, input as any);
      return { snap };
    },
    onError: (e: Error, _v, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal memperbarui dompet: ' + e.message);
    },
    onSuccess: (data) => {
      toast.success('Dompet berhasil diperbarui!');
      logUserActivity(user!.id, 'update', 'wallet', data.id, { name: data.name });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalances'] });
    },
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      const snap = await optimisticDelete(queryClient, ['wallets'], id);
      return { snap };
    },
    onError: (e: Error, _id, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal menghapus dompet: ' + e.message);
    },
    onSuccess: (id) => {
      toast.success('Dompet berhasil dihapus!');
      logUserActivity(user!.id, 'delete', 'wallet', id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalances'] });
    },
  });
}
