import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Map table -> query keys to invalidate on any change
const TABLE_QUERY_KEYS: Record<string, string[][]> = {
  transactions: [['transactions'], ['monthlyStats'], ['walletBalances'], ['budgets']],
  categories: [['categories']],
  budgets: [['budgets']],
  wallets: [['wallets'], ['walletBalances']],
  wallet_transfers: [['walletTransfers'], ['wallets'], ['walletBalances']],
  debts: [['debts']],
  goals: [['goals']],
  recurring_transactions: [['recurringTransactions']],
  notifications: [['notifications']],
  profiles: [['profile']],
  activity_logs: [['activityLogs']],
};

/**
 * Subscribes to realtime changes on the user's rows across all main tables
 * and invalidates related React Query caches so the UI updates live.
 */
export function useRealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`realtime-user-${user.id}`);

    Object.keys(TABLE_QUERY_KEYS).forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          TABLE_QUERY_KEYS[table].forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
