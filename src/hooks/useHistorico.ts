import { useState, useCallback, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';

export interface HistoricoImportacao {
  id: string;
  nome_arquivo: string;
  tipo_importacao: string;
  localidade: string;
  mes_referencia: string;
  ano_referencia: number;
  quantidade_registros: number;
  status: string;
  imported_at: string;
}

export const useHistorico = () => {
  const [historico, setHistorico] = useState<HistoricoImportacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('historico_importacoes')
        .select('*')
        .order('imported_at', { ascending: false });

      if (error) throw error;
      setHistorico((data as HistoricoImportacao[]) || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  return {
    historico,
    loading,
    fetchHistorico,
  };
};
