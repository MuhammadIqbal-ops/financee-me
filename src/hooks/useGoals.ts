import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Goal } from '@/types/database';
import { toast } from 'sonner';
import { logUserActivity } from '@/lib/activityLogger';
import { optimisticInsert, optimisticUpdate, optimisticDelete, rollback, tempId, Snapshot } from '@/lib/optimistic';

export interface GoalInput {
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
}

export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: GoalInput) => {
      const { data, error } = await supabase.from('goals').insert({ user_id: user!.id, ...input }).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      const optimistic = { id: tempId(), user_id: user?.id, current_amount: 0, ...input };
      const snap = await optimisticInsert(queryClient, ['goals'], optimistic as any);
      return { snap };
    },
    onError: (error: Error, _v, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal menambahkan target: ' + error.message);
    },
    onSuccess: (data) => {
      toast.success('Target berhasil ditambahkan!');
      logUserActivity(user!.id, 'create', 'goal', data.id, { name: data.name });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<GoalInput> & { id: string }) => {
      const { data, error } = await supabase.from('goals').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...input }) => {
      const snap = await optimisticUpdate(queryClient, ['goals'], id, input as any);
      return { snap };
    },
    onError: (error: Error, _v, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal memperbarui target: ' + error.message);
    },
    onSuccess: (data) => {
      toast.success('Target berhasil diperbarui!');
      logUserActivity(user!.id, 'update', 'goal', data.id, { name: data.name });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      const snap = await optimisticDelete(queryClient, ['goals'], id);
      return { snap };
    },
    onError: (error: Error, _id, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal menghapus target: ' + error.message);
    },
    onSuccess: (id) => {
      toast.success('Target berhasil dihapus!');
      logUserActivity(user!.id, 'delete', 'goal', id);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}
