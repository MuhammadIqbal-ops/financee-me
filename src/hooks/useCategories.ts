import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Category, TransactionType } from '@/types/database';
import { toast } from 'sonner';
import { optimisticInsert, optimisticUpdate, optimisticDelete, rollback, tempId, Snapshot } from '@/lib/optimistic';

export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export function useCategories(type?: TransactionType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', user?.id, type],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*')
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ user_id: user!.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      const optimistic = { id: tempId(), user_id: user?.id, ...input };
      const snap = await optimisticInsert(queryClient, ['categories'], optimistic as any);
      return { snap };
    },
    onError: (error: Error, _v, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal menambahkan kategori: ' + error.message);
    },
    onSuccess: () => toast.success('Kategori berhasil ditambahkan!'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: CategoryInput & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...input }) => {
      const snap = await optimisticUpdate(queryClient, ['categories'], id, input as any);
      return { snap };
    },
    onError: (error: Error, _v, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal memperbarui kategori: ' + error.message);
    },
    onSuccess: () => toast.success('Kategori berhasil diperbarui!'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      const snap = await optimisticDelete(queryClient, ['categories'], id);
      return { snap };
    },
    onError: (error: Error, _id, ctx) => {
      rollback(queryClient, (ctx as { snap?: Snapshot })?.snap);
      toast.error('Gagal menghapus kategori: ' + error.message);
    },
    onSuccess: () => toast.success('Kategori berhasil dihapus!'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}
