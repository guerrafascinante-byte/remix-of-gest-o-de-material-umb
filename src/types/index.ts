// Types for the Material Management System

export interface Material {
  id: string;
  codigo: string;
  nome: string;
  unidade: string;
  tipo: string;
  categoria: string;
}

export interface Reserva {
  id: string;
  numeroReserva: string;
  materialId: string;
  materialCodigo: string;
  materialNome: string;
  quantidadeSolicitada: number;
  quantidadeReservada: number;
  quantidadeLiberada: number;
  quantidadeUtilizada: number;
  saldo: number;
  localidade: 'Lauro' | 'Salvador';
  dataReserva: string;
  dataSolicitacao: string;
  dataLiberacao?: string;
  status: 'Pendente' | 'Liberado' | 'Parcialmente Liberado' | 'Concluído' | 'Parcial' | string;
  justificativa?: string;
  empreiteira: string;
}

export interface Empreiteira {
  id: string;
  nome: string;
  cnpj: string;
  contato: string;
}

export interface MovimentacaoMaterial {
  id: string;
  reservaId: string;
  materialId: string;
  tipo: 'entrada' | 'saida' | 'utilizacao';
  quantidade: number;
  data: string;
  observacao?: string;
  localidade: 'Lauro' | 'Salvador';
}

export interface DashboardMetrics {
  totalReservas: number;
  totalMateriasSolicitados: number;
  totalLiberado: number;
  totalUtilizado: number;
  diferencaTotal: number;
  saldoEstoque: number;
}

export interface ImportacaoHistorico {
  id: string;
  tipo: 'solicitacao' | 'reserva' | 'liberacao' | 'utilizacao';
  arquivo: string;
  dataImportacao: string;
  quantidadeRegistros: number;
  periodo: string;
  status: 'sucesso' | 'erro' | 'parcial';
}

export type LocalidadeType = 'Lauro' | 'Salvador' | 'Todos';
export type PeriodoType = 'semanal' | 'quinzenal' | 'mensal' | 'todos';
