import { useState, useCallback, useMemo } from 'react';
import { Reserva, LocalidadeType, PeriodoType, DashboardMetrics } from '@/types';
import { reservas as initialReservas, calcularMetricas } from '@/data/mockData';

export const useMateriais = () => {
  const [reservas, setReservas] = useState<Reserva[]>(initialReservas);
  const [filtroLocalidade, setFiltroLocalidade] = useState<LocalidadeType>('Todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState<PeriodoType>('todos');
  const [filtroMaterial, setFiltroMaterial] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroMes, setFiltroMes] = useState<string>('Todos');

  const reservasFiltradas = useMemo(() => {
    return reservas.filter(reserva => {
      const matchLocalidade = filtroLocalidade === 'Todos' || reserva.localidade === filtroLocalidade;
      const matchMaterial = !filtroMaterial || 
        reserva.materialNome.toLowerCase().includes(filtroMaterial.toLowerCase()) ||
        reserva.materialCodigo.includes(filtroMaterial);
      const matchStatus = filtroStatus === 'Todos' || reserva.status === filtroStatus;
      
      let matchMes = true;
      if (filtroMes !== 'Todos' && reserva.dataReserva) {
        const mesReserva = String(new Date(reserva.dataReserva).getMonth() + 1).padStart(2, '0');
        matchMes = mesReserva === filtroMes;
      }
      
      return matchLocalidade && matchMaterial && matchStatus && matchMes;
    });
  }, [reservas, filtroLocalidade, filtroPeriodo, filtroMaterial, filtroStatus, filtroMes]);

  const metricas = useMemo((): DashboardMetrics => {
    return calcularMetricas(reservasFiltradas);
  }, [reservasFiltradas]);

  const adicionarReserva = useCallback((novaReserva: Omit<Reserva, 'id'>) => {
    const id = `${Date.now()}`;
    setReservas(prev => [...prev, { ...novaReserva, id }]);
  }, []);

  const atualizarReserva = useCallback((id: string, dados: Partial<Reserva>) => {
    setReservas(prev => prev.map(r => r.id === id ? { ...r, ...dados } : r));
  }, []);

  const importarReservas = useCallback((novasReservas: Omit<Reserva, 'id'>[]) => {
    const reservasComId = novasReservas.map((r, index) => ({
      ...r,
      id: `${Date.now()}-${index}`,
    }));
    setReservas(prev => [...prev, ...reservasComId]);
  }, []);

  const topMateriaisUtilizados = useMemo(() => {
    const agrupado = reservasFiltradas.reduce((acc, r) => {
      if (!acc[r.materialNome]) {
        acc[r.materialNome] = { nome: r.materialNome, quantidade: 0 };
      }
      acc[r.materialNome].quantidade += r.quantidadeUtilizada;
      return acc;
    }, {} as Record<string, { nome: string; quantidade: number }>);
    
    return Object.values(agrupado)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [reservasFiltradas]);

  const materiaisComDivergencia = useMemo(() => {
    return reservasFiltradas
      .map(r => ({
        ...r,
        divergencia: r.quantidadeLiberada - r.quantidadeUtilizada,
        percentualDivergencia: r.quantidadeLiberada > 0 
          ? ((r.quantidadeLiberada - r.quantidadeUtilizada) / r.quantidadeLiberada) * 100 
          : 0
      }))
      .filter(r => r.divergencia > 0)
      .sort((a, b) => b.divergencia - a.divergencia);
  }, [reservasFiltradas]);

  const evolucaoMensal = useMemo(() => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return meses.map((mes, index) => {
      const reservasDoMes = reservasFiltradas.filter(r => {
        const mesReserva = new Date(r.dataReserva).getMonth();
        return mesReserva === index;
      });
      
      return {
        mes,
        solicitado: reservasDoMes.reduce((acc, r) => acc + r.quantidadeSolicitada, 0),
        liberado: reservasDoMes.reduce((acc, r) => acc + r.quantidadeLiberada, 0),
        utilizado: reservasDoMes.reduce((acc, r) => acc + r.quantidadeUtilizada, 0),
      };
    });
  }, [reservasFiltradas]);

  const distribuicaoPorLocal = useMemo(() => {
    const lauro = reservasFiltradas.filter(r => r.localidade === 'Lauro');
    const salvador = reservasFiltradas.filter(r => r.localidade === 'Salvador');
    
    return [
      { name: 'Lauro de Freitas', value: lauro.reduce((acc, r) => acc + r.quantidadeUtilizada, 0), fill: 'hsl(var(--chart-1))' },
      { name: 'Salvador', value: salvador.reduce((acc, r) => acc + r.quantidadeUtilizada, 0), fill: 'hsl(var(--chart-2))' },
    ];
  }, [reservasFiltradas]);

  return {
    reservas,
    reservasFiltradas,
    metricas,
    filtroLocalidade,
    setFiltroLocalidade,
    filtroPeriodo,
    setFiltroPeriodo,
    filtroMaterial,
    setFiltroMaterial,
    filtroStatus,
    setFiltroStatus,
    filtroMes,
    setFiltroMes,
    adicionarReserva,
    atualizarReserva,
    importarReservas,
    topMateriaisUtilizados,
    materiaisComDivergencia,
    evolucaoMensal,
    distribuicaoPorLocal,
  };
};
