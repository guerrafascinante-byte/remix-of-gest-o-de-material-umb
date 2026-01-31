import { useState, useCallback, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface Empreiteira {
  id: string;
  nome: string;
  cnpj?: string;
  contato?: string;
  ativo: boolean;
  created_at: string;
}

export const useEmpreiteiras = () => {
  const [empreiteiras, setEmpreiteiras] = useState<Empreiteira[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmpreiteiras = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('empreiteiras')
        .select('*')
        .order('nome');

      if (error) throw error;
      setEmpreiteiras((data as Empreiteira[]) || []);
    } catch (error) {
      console.error('Erro ao buscar empreiteiras:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmpreiteiras();
  }, [fetchEmpreiteiras]);

  const adicionarEmpreiteira = useCallback(async (dados: Partial<Empreiteira>) => {
    try {
      const { error } = await supabaseClient
        .from('empreiteiras')
        .insert(dados);
      
      if (error) throw error;
      
      await fetchEmpreiteiras();
      toast({ title: 'Sucesso', description: 'Empreiteira adicionada com sucesso.' });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar empreiteira:', error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar.', variant: 'destructive' });
      return false;
    }
  }, [fetchEmpreiteiras, toast]);

  const atualizarEmpreiteira = useCallback(async (id: string, dados: Partial<Empreiteira>) => {
    try {
      const { error } = await supabaseClient
        .from('empreiteiras')
        .update(dados)
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchEmpreiteiras();
      toast({ title: 'Sucesso', description: 'Empreiteira atualizada com sucesso.' });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar empreiteira:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar.', variant: 'destructive' });
      return false;
    }
  }, [fetchEmpreiteiras, toast]);

  const excluirEmpreiteira = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from('empreiteiras')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchEmpreiteiras();
      toast({ title: 'Sucesso', description: 'Empreiteira excluída com sucesso.' });
      return true;
    } catch (error) {
      console.error('Erro ao excluir empreiteira:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
      return false;
    }
  }, [fetchEmpreiteiras, toast]);

  return {
    empreiteiras,
    loading,
    fetchEmpreiteiras,
    adicionarEmpreiteira,
    atualizarEmpreiteira,
    excluirEmpreiteira,
  };
};
