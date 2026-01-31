import { Material, Reserva, Empreiteira, MovimentacaoMaterial, DashboardMetrics } from '@/types';

// Dados vazios para produção - serão preenchidos via upload
export const materiais: Material[] = [];

export const empreiteiras: Empreiteira[] = [
  { id: '1', nome: 'Consórcio Nova Bolandeira II', cnpj: '12.345.678/0001-90', contato: 'contato@novabolandeira.com.br' },
];

export const reservas: Reserva[] = [];

export const movimentacoes: MovimentacaoMaterial[] = [];

export const calcularMetricas = (reservasData: Reserva[]): DashboardMetrics => {
  return {
    totalReservas: reservasData.length,
    totalMateriasSolicitados: reservasData.reduce((acc, r) => acc + r.quantidadeSolicitada, 0),
    totalLiberado: reservasData.reduce((acc, r) => acc + r.quantidadeLiberada, 0),
    totalUtilizado: reservasData.reduce((acc, r) => acc + r.quantidadeUtilizada, 0),
    diferencaTotal: reservasData.reduce((acc, r) => acc + (r.quantidadeLiberada - r.quantidadeUtilizada), 0),
    saldoEstoque: reservasData.reduce((acc, r) => acc + r.saldo, 0),
  };
};
