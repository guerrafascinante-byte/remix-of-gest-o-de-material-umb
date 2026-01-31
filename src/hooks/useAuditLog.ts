import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT';

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_name: string;
  action: AuditAction;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  description: string | null;
  created_at: string;
}

export const useAuditLog = () => {
  const { user, profile } = useAuth();

  const logAction = useCallback(async (
    action: AuditAction,
    tableName: string,
    recordId: string | null,
    description: string,
    oldValues?: Record<string, any> | null,
    newValues?: Record<string, any> | null
  ) => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id || null,
          user_name: profile?.name || user?.email || 'Sistema',
          action,
          table_name: tableName,
          record_id: recordId,
          old_values: oldValues || null,
          new_values: newValues || null,
          description,
        });

      if (error) {
        console.error('Erro ao registrar audit log:', error);
      }
    } catch (err) {
      console.error('Erro ao registrar audit log:', err);
    }
  }, [user, profile]);

  const fetchLogs = useCallback(async (
    tableName?: string,
    recordId?: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      if (recordId) {
        query = query.eq('record_id', recordId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as AuditLogEntry[]) || [];
    } catch (err) {
      console.error('Erro ao buscar audit logs:', err);
      return [];
    }
  }, []);

  return {
    logAction,
    fetchLogs,
  };
};
