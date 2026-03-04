import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

export function useActivityLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!user,
  });

  const logActivity = useMutation({
    mutationFn: async (log: {
      action: string;
      entity_type: string;
      entity_id?: string;
      details?: Record<string, any>;
    }) => {
      const { error } = await supabase.from('activity_logs').insert({
        user_id: user!.id,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id || null,
        details: log.details || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });

  const clearLogs = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });

  return { logs, isLoading, logActivity, clearLogs };
}
