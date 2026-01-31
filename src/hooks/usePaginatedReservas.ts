import { useState, useCallback, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { Reserva } from './useReservas';

interface PaginationFilters {
  localidade?: string;
  material?: string;
  status?: string;
  mes?: string;
}

interface UsePaginatedReservasOptions {
  pageSize?: number;
  filters?: PaginationFilters;
  onlyLiberados?: boolean;
}

interface PaginatedResult {
  data: Reserva[];
  total: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
}

export const usePaginatedReservas = (options: UsePaginatedReservasOptions = {}): PaginatedResult => {
  const { pageSize = 20, filters = {}, onlyLiberados = false } = options;
  
  const [data, setData] = useState<Reserva[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * pageSize;

      let query = supabaseClient
        .from('reservas')
        .select('*', { count: 'exact' });

      // Aplicar filtro de apenas liberados
      if (onlyLiberados) {
        query = query.gt('quantidade_liberada', 0);
      }

      // Aplicar filtros
      if (filters.localidade && filters.localidade !== 'Todos') {
        query = query.eq('localidade', filters.localidade);
      }

      if (filters.material) {
        query = query.or(`material_nome.ilike.%${filters.material}%,material_codigo.ilike.%${filters.material}%`);
      }

      if (filters.status && filters.status !== 'Todos') {
        query = query.eq('status', filters.status);
      }

      if (filters.mes && filters.mes !== 'Todos') {
        query = query.eq('mes_referencia', filters.mes);
      }

      // Ordenação e paginação
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data: result, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setData((result as Reserva[]) || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Erro ao buscar reservas paginadas:', err);
      setError('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, onlyLiberados]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset para página 1 quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.localidade, filters.material, filters.status, filters.mes]);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    total,
    totalPages,
    currentPage,
    loading,
    error,
    setPage,
    refresh: fetchData,
  };
};
