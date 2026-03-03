import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface DashboardLayout {
  widgets: string[];
  visible: Record<string, boolean>;
}

const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: ['budget', 'goals', 'recurring', 'wallets', 'debts'],
  visible: { budget: true, goals: true, recurring: true, wallets: true, debts: true },
};

export const WIDGET_LABELS: Record<string, string> = {
  budget: 'Anggaran',
  goals: 'Target Keuangan',
  recurring: 'Transaksi Berulang',
  wallets: 'Dompet',
  debts: 'Hutang/Piutang',
};

export function useDashboardLayout() {
  const { data: profile } = useProfile();
  const raw = profile?.dashboard_layout as unknown as DashboardLayout | null;
  return raw && raw.widgets ? raw : DEFAULT_LAYOUT;
}

export function useUpdateDashboardLayout() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (layout: DashboardLayout) => {
      const { error } = await supabase
        .from('profiles')
        .update({ dashboard_layout: layout as any })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Layout dashboard disimpan!');
    },
    onError: (e: Error) => toast.error('Gagal menyimpan layout: ' + e.message),
  });
}
