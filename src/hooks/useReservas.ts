import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface Reserva {
  id: string;
  numero_reserva: string;
  material_codigo: string;
  material_nome: string;
  quantidade_solicitada: number;
  quantidade_liberada: number;
  quantidade_utilizada: number;
  saldo: number;
  localidade: 'Lauro' | 'Salvador';
  mes_referencia: string;
  ano_referencia: number;
  status: string;
  justificativa?: string;
  empreiteira: string;
  data_reserva?: string;
  data_solicitacao?: string;
  data_liberacao?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  totalReservas: number;
  totalLiberado: number;
  totalUtilizado: number;
  saldoEstoque: number;
  divergenciaTotal: number;
}

interface HistoricoImportacao {
  id: string;
  tipo_importacao: string;
  localidade: string;
  mes_referencia: string;
  ano_referencia: number;
  nome_arquivo: string;
  quantidade_registros: number;
  status: string;
  imported_at: string;
  empreiteira?: string;
}

export const useReservas = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [historicoImportacoes, setHistoricoImportacoes] = useState<HistoricoImportacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroLocalidade, setFiltroLocalidade] = useState<string>('Todos');
  const [filtroMaterial, setFiltroMaterial] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroMes, setFiltroMes] = useState<string>('Todos');
  const [filtroAno, setFiltroAno] = useState<number>(new Date().getFullYear());
  const { toast } = useToast();

  const fetchReservas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('reservas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservas((data as Reserva[]) || []);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as reservas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchHistoricoImportacoes = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from('historico_importacoes')
        .select('*')
        .order('imported_at', { ascending: false });

      if (error) throw error;
      setHistoricoImportacoes((data as HistoricoImportacao[]) || []);
    } catch (error) {
      console.error('Erro ao buscar histórico de importações:', error);
      // Não bloqueia o dashboard; apenas mantém o valor anterior.
    }
  }, []);

  useEffect(() => {
    fetchReservas();
    fetchHistoricoImportacoes();
  }, [fetchReservas]);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter(reserva => {
      const matchLocalidade = filtroLocalidade === 'Todos' || reserva.localidade === filtroLocalidade;
      const matchMaterial = !filtroMaterial || 
        reserva.material_nome.toLowerCase().includes(filtroMaterial.toLowerCase()) ||
        reserva.material_codigo.includes(filtroMaterial);
      const matchStatus = filtroStatus === 'Todos' || reserva.status === filtroStatus;
      const matchMes = filtroMes === 'Todos' || reserva.mes_referencia === filtroMes;
      const matchAno = reserva.ano_referencia === filtroAno;
      
      return matchLocalidade && matchMaterial && matchStatus && matchMes && matchAno;
    });
  }, [reservas, filtroLocalidade, filtroMaterial, filtroStatus, filtroMes, filtroAno]);

  // Total de Reservas = quantidade de IMPORTAÇÕES do tipo "liberacao" (1 por upload),
  // e não a quantidade de linhas/materiais.
  const metricas = useMemo((): DashboardMetrics => {
    const historicoFiltrado = historicoImportacoes.filter(h => {
      const matchLocalidade = filtroLocalidade === 'Todos' || h.localidade === filtroLocalidade;
      const matchMes = filtroMes === 'Todos' || h.mes_referencia === filtroMes;
      const matchAno = h.ano_referencia === filtroAno;
      return matchLocalidade && matchMes && matchAno;
    });

    const totalReservas = historicoFiltrado.filter(
      h => h.tipo_importacao === 'liberacao' && h.status === 'Sucesso'
    ).length;
    
    return {
      totalReservas,
      totalLiberado: reservasFiltradas.reduce((acc, r) => acc + r.quantidade_liberada, 0),
      totalUtilizado: reservasFiltradas.reduce((acc, r) => acc + r.quantidade_utilizada, 0),
      saldoEstoque: reservasFiltradas.reduce((acc, r) => acc + (r.quantidade_liberada - r.quantidade_utilizada), 0),
      divergenciaTotal: reservasFiltradas.reduce((acc, r) => {
        const diff = r.quantidade_liberada - r.quantidade_utilizada;
        return acc + (diff < 0 ? Math.abs(diff) : 0); // Divergência = utilizado > liberado
      }, 0),
    };
  }, [reservasFiltradas, historicoImportacoes, filtroLocalidade, filtroMes, filtroAno]);

  const importarDados = useCallback(async (
    dados: any[],
    tipo: 'solicitacao' | 'liberacao' | 'utilizacao',
    localidade: string,
    mesReferencia: string,
    nomeArquivo: string,
    empreiteira: string = 'Consórcio Nova Bolandeira II'
  ) => {
    try {
      let registrosProcessados = 0;
      let registrosAtualizados = 0;
      let registrosNovos = 0;

      for (const row of dados) {
        // Mapeamento flexível de colunas de diferentes formatos de Excel/SAP
        const materialCodigo =
          row.codigo_sap ||
          row['codigo_sap'] ||
          row['Código SAP'] ||
          row['Codigo SAP'] ||
          row['CODIGO SAP'] ||
          row['Código'] ||
          row['CODIGO'] ||
          row['Material'] ||
          row['Nº material'] ||
          '';

        const materialNome =
          row.nome_material ||
          row['nome_material'] ||
          row['Nome_material'] ||
          row['Nome material'] ||
          row['Nome'] ||
          row['nome'] ||
          row['NOME'] ||
          row['NOME_MATERIAL'] ||
          row['Descrição'] ||
          row['Texto breve material'] ||
          row['Material'] ||
          '';

        // Para tipo "utilizacao", buscar primeiro na coluna "Quantidade Utilizada"
        let quantidade: number;
        if (tipo === 'utilizacao') {
          quantidade = Number(
            row['Quantidade Utilizada'] ||
              row['quantidade_utilizada'] ||
              row['Total Utilizado'] ||
              row['Qtd Utilizada'] ||
              row.quantidade ||
              row['quantidade'] ||
              row['Quantidade'] ||
              row['QTD'] ||
              row['Qtd'] ||
              0
          );
        } else {
          quantidade = Number(
            row.quantidade ||
              row['quantidade'] ||
              row['Quantidade'] ||
              row['QTD'] ||
              row['Qtd'] ||
              row['Qtd.necessária'] ||
              0
          );
        }

        // Quando não existir um identificador confiável na planilha, usamos o nome do arquivo
        // para evitar gerar um número diferente por linha.
        const numeroReserva =
          row.numero_reserva ||
          row['numero_reserva'] ||
          row['Reserva'] ||
          row['reserva'] ||
          row['Nº reserva'] ||
          row['Numero da reserva'] ||
          row['Número da reserva'] ||
          row['Número'] ||
          row['numero'] ||
          row['codigo'] ||
          row['Código'] ||
          nomeArquivo;

        if (!materialNome || isNaN(quantidade) || quantidade <= 0) {
          console.log('Linha ignorada - materialNome:', materialNome, 'quantidade:', quantidade);
          continue;
        }

        const materialNomeTrimmed = String(materialNome).trim().toUpperCase();
        
        // Buscar primeiro por material_codigo (identificador único), depois por nome exato
        let existingReserva = null;
        const materialCodigoTrimmed = String(materialCodigo).trim();
        
        // Primeira tentativa: match por código do material (mais confiável)
        if (materialCodigoTrimmed) {
          const { data: byCode } = await supabaseClient
            .from('reservas')
            .select('*')
            .eq('material_codigo', materialCodigoTrimmed)
            .eq('localidade', localidade)
            .eq('mes_referencia', mesReferencia)
            .maybeSingle();
          
          existingReserva = byCode;
        }
        
        // Segunda tentativa: match exato por nome completo (case-insensitive)
        if (!existingReserva) {
          const { data: byName } = await supabaseClient
            .from('reservas')
            .select('*')
            .ilike('material_nome', materialNomeTrimmed)
            .eq('localidade', localidade)
            .eq('mes_referencia', mesReferencia)
            .maybeSingle();
          
          existingReserva = byName;
        }
        
        // Match parcial REMOVIDO - causava conflitos com materiais similares
        
        console.log('Match result for:', materialNomeTrimmed.substring(0, 30), '-> found:', !!existingReserva);

        if (existingReserva) {
          // Atualizar registro existente com o campo correto baseado no tipo
          const updateData: Record<string, any> = {};

          // Sempre atualiza identificadores normalizados (corrige imports antigos)
          if (materialCodigo) updateData.material_codigo = String(materialCodigo).trim();
          updateData.material_nome = String(materialNome).trim();
          if (numeroReserva) updateData.numero_reserva = String(numeroReserva).trim();
          updateData.empreiteira = empreiteira;
          
          if (tipo === 'solicitacao') {
            updateData.quantidade_solicitada = quantidade;
          }
          if (tipo === 'liberacao') {
            updateData.quantidade_liberada = quantidade;
            updateData.data_liberacao = new Date().toISOString().split('T')[0];
            updateData.status = 'Liberado';
          }
          if (tipo === 'utilizacao') {
            updateData.quantidade_utilizada = quantidade;
            const novoSaldo = (existingReserva as any).quantidade_liberada - quantidade;
            updateData.status = novoSaldo <= 0 ? 'Concluído' : 'Parcial';
          }

          const { error: updateError } = await supabaseClient
            .from('reservas')
            .update(updateData)
            .eq('id', (existingReserva as any).id);
          
          if (!updateError) registrosAtualizados++;
        } else {
          // Criar novo registro
          const novaReserva: any = {
            numero_reserva: String(numeroReserva),
            material_codigo: String(materialCodigo).trim(),
            material_nome: String(materialNome).trim(),
            quantidade_solicitada: tipo === 'solicitacao' ? quantidade : 0,
            quantidade_liberada: tipo === 'liberacao' ? quantidade : 0,
            quantidade_utilizada: tipo === 'utilizacao' ? quantidade : 0,
            localidade: localidade,
            mes_referencia: mesReferencia,
            ano_referencia: filtroAno,
            status: tipo === 'liberacao' ? 'Liberado' : 'Pendente',
            data_reserva: new Date().toISOString().split('T')[0],
            empreiteira: empreiteira,
          };

          if (tipo === 'liberacao') {
            novaReserva.data_liberacao = new Date().toISOString().split('T')[0];
          }

          const { error: insertError } = await supabaseClient
            .from('reservas')
            .insert(novaReserva);
          
          if (!insertError) registrosNovos++;
        }
        registrosProcessados++;
      }

      await supabaseClient
        .from('historico_importacoes')
        .insert({
          nome_arquivo: nomeArquivo,
          tipo_importacao: tipo,
          localidade: localidade,
          mes_referencia: mesReferencia,
          ano_referencia: filtroAno,
          quantidade_registros: registrosProcessados,
          status: 'Sucesso',
          empreiteira: empreiteira,
        });

      await Promise.all([fetchReservas(), fetchHistoricoImportacoes()]);
      
      const tipoLabel = tipo === 'solicitacao' ? 'Solicitados' : tipo === 'liberacao' ? 'Liberados' : 'Utilizados';
      toast({
        title: 'Importação concluída!',
        description: `${registrosProcessados} registros de "${tipoLabel}" processados (${registrosNovos} novos, ${registrosAtualizados} atualizados).`,
      });

      return true;
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao processar os dados.',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchReservas, fetchHistoricoImportacoes, toast, filtroAno]);

  const adicionarReserva = useCallback(async (novaReserva: Partial<Reserva>) => {
    try {
      const { error } = await supabaseClient
        .from('reservas')
        .insert(novaReserva);
      
      if (error) throw error;
      
      await fetchReservas();
      toast({ title: 'Sucesso', description: 'Reserva adicionada com sucesso.' });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar reserva:', error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar a reserva.', variant: 'destructive' });
      return false;
    }
  }, [fetchReservas, toast]);

  const atualizarReserva = useCallback(async (id: string, dados: Partial<Reserva>) => {
    try {
      const { error } = await supabaseClient
        .from('reservas')
        .update(dados)
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchReservas();
      toast({ title: 'Sucesso', description: 'Reserva atualizada com sucesso.' });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar reserva:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a reserva.', variant: 'destructive' });
      return false;
    }
  }, [fetchReservas, toast]);

  const excluirReserva = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from('reservas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchReservas();
      toast({ title: 'Sucesso', description: 'Reserva excluída com sucesso.' });
      return true;
    } catch (error) {
      console.error('Erro ao excluir reserva:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir a reserva.', variant: 'destructive' });
      return false;
    }
  }, [fetchReservas, toast]);

  // Top 5 materiais - usa quantidade_liberada pois "utilizados" pode estar zerado
  // Prioriza: utilizada > liberada > solicitada
  const topMateriaisUtilizados = useMemo(() => {
    const agrupado = reservasFiltradas.reduce((acc, r) => {
      if (!acc[r.material_nome]) {
        acc[r.material_nome] = { nome: r.material_nome, quantidade: 0 };
      }
      // Usa a maior quantidade disponível para exibição
      const qtdMaior = Math.max(r.quantidade_utilizada, r.quantidade_liberada, r.quantidade_solicitada);
      acc[r.material_nome].quantidade += qtdMaior;
      return acc;
    }, {} as Record<string, { nome: string; quantidade: number }>);
    
    return Object.values(agrupado)
      .filter(item => item.quantidade > 0)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [reservasFiltradas]);

  const materiaisComDivergencia = useMemo(() => {
    return reservasFiltradas
      .map(r => ({
        materialNome: r.material_nome,
        divergencia: r.quantidade_liberada - r.quantidade_utilizada,
        percentualDivergencia: r.quantidade_liberada > 0 
          ? ((r.quantidade_liberada - r.quantidade_utilizada) / r.quantidade_liberada) * 100 
          : 0
      }))
      .filter(r => r.divergencia > 0)
      .sort((a, b) => b.divergencia - a.divergencia);
  }, [reservasFiltradas]);

  const evolucaoMensal = useMemo(() => {
    const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses.map((mes, index) => {
      const reservasDoMes = reservasFiltradas.filter(r => r.mes_referencia === mes);
      
      return {
        mes: nomesMeses[index],
        liberado: reservasDoMes.reduce((acc, r) => acc + r.quantidade_liberada, 0),
        utilizado: reservasDoMes.reduce((acc, r) => acc + r.quantidade_utilizada, 0),
      };
    });
  }, [reservasFiltradas]);

  // Comparação Liberado vs Utilizado para o gráfico de pizza
  const distribuicaoLiberadoUtilizado = useMemo(() => {
    const totalLiberado = reservasFiltradas.reduce((acc, r) => acc + r.quantidade_liberada, 0);
    const totalUtilizado = reservasFiltradas.reduce((acc, r) => acc + r.quantidade_utilizada, 0);
    
    return [
      { name: 'Qtd. Liberada', value: totalLiberado, fill: 'hsl(var(--primary))' },
      { name: 'Qtd. Utilizada', value: totalUtilizado, fill: 'hsl(var(--chart-1))' },
    ];
  }, [reservasFiltradas]);

  // Visão geral por material agregado
  const visaoGeralPorMaterial = useMemo(() => {
    const agrupado = reservasFiltradas.reduce((acc, r) => {
      const key = r.material_nome;
      if (!acc[key]) {
        acc[key] = {
          nome: r.material_nome,
          codigo: r.material_codigo,
          liberado: 0,
          utilizado: 0,
          saldo: 0,
          reservas: 0,
        };
      }
      acc[key].liberado += r.quantidade_liberada;
      acc[key].utilizado += r.quantidade_utilizada;
      acc[key].saldo += (r.quantidade_liberada - r.quantidade_utilizada);
      acc[key].reservas += 1;
      return acc;
    }, {} as Record<string, { nome: string; codigo: string; liberado: number; utilizado: number; saldo: number; reservas: number }>);

    return Object.values(agrupado)
      .map(m => ({
        ...m,
        taxaUtilizacao: m.liberado > 0 ? (m.utilizado / m.liberado) * 100 : 0,
      }))
      .sort((a, b) => b.liberado - a.liberado);
  }, [reservasFiltradas]);

  // Métricas de análise para cards
  const metricasAnalise = useMemo(() => {
    const materiais = visaoGeralPorMaterial;
    const totalLiberado = materiais.reduce((acc, m) => acc + m.liberado, 0);
    const totalUtilizado = materiais.reduce((acc, m) => acc + m.utilizado, 0);
    
    return {
      taxaUtilizacao: totalLiberado > 0 ? (totalUtilizado / totalLiberado) * 100 : 0,
      materiaisUnicos: materiais.length,
      mediaPorMaterial: materiais.length > 0 ? Math.round(totalLiberado / materiais.length) : 0,
      altaEficiencia: materiais.filter(m => m.taxaUtilizacao >= 80).length,
      baixaEficiencia: materiais.filter(m => m.taxaUtilizacao < 40 && m.liberado > 0).length,
    };
  }, [visaoGeralPorMaterial]);

  // Distribuição por faixa de eficiência
  const distribuicaoEficiencia = useMemo(() => {
    const materiais = visaoGeralPorMaterial.filter(m => m.liberado > 0);
    const alta = materiais.filter(m => m.taxaUtilizacao >= 80).length;
    const media = materiais.filter(m => m.taxaUtilizacao >= 40 && m.taxaUtilizacao < 80).length;
    const baixa = materiais.filter(m => m.taxaUtilizacao < 40).length;
    
    return [
      { name: 'Alta (≥80%)', value: alta, fill: 'hsl(var(--chart-2))' },
      { name: 'Média (40-80%)', value: media, fill: 'hsl(var(--chart-4))' },
      { name: 'Baixa (<40%)', value: baixa, fill: 'hsl(var(--chart-1))' },
    ];
  }, [visaoGeralPorMaterial]);

  return {
    reservas,
    reservasFiltradas,
    historicoImportacoes,
    loading,
    metricas,
    filtroLocalidade,
    setFiltroLocalidade,
    filtroMaterial,
    setFiltroMaterial,
    filtroStatus,
    setFiltroStatus,
    filtroMes,
    setFiltroMes,
    filtroAno,
    setFiltroAno,
    fetchReservas,
    importarDados,
    adicionarReserva,
    atualizarReserva,
    excluirReserva,
    topMateriaisUtilizados,
    materiaisComDivergencia,
    evolucaoMensal,
    distribuicaoLiberadoUtilizado,
    visaoGeralPorMaterial,
    metricasAnalise,
    distribuicaoEficiencia,
  };
};
