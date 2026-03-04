import { supabase } from '@/integrations/supabase/client';

export function logUserActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
) {
  // Fire and forget - don't block the main flow
  supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
    })
    .then(({ error }) => {
      if (error) console.error('Failed to log activity:', error);
    });
}
