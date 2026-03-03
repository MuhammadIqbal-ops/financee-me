import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface WalletTransfer {
  id: string;
  user_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
}

export interface TransferInput {
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  note?: string;
  date?: string;
}

export function useWalletTransfers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['walletTransfers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transfers')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as WalletTransfer[];
    },
    enabled: !!user,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: TransferInput) => {
      const { data, error } = await supabase
        .from('wallet_transfers')
        .insert({ user_id: user!.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalances'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Transfer berhasil!');
    },
    onError: (e: Error) => toast.error('Transfer gagal: ' + e.message),
  });
}
