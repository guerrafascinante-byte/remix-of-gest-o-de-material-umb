import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Package, Search, Edit, AlertTriangle, Plus, Minus, ArrowRight, FileDown, FileSpreadsheet } from 'lucide-react';
import { exportToPDF, exportToCSV, materiaisColumns } from '@/lib/exportUtils';
import { useState, useMemo, useEffect, useCallback } from 'react';

type TipoAjuste = 'liberacao' | 'utilizacao' | 'correcao';
import { useReservas } from '@/hooks/useReservas';

interface MaterialEmEstoque {
  material_codigo: string;
  material_nome: string;
  total_liberado: number;
  total_utilizado: number;
  saldo: number;
  reserva_ids: string[];
}

interface EditingItem {
  material_codigo: string;
  material_nome: string;
  total_liberado: number;
  total_utilizado: number;
  saldo: number;
  reserva_ids: string[];
}

// Opções de meses
const mesesOptions = [
  { value: 'Todos', label: 'Todos os Meses' },
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const MateriaisPage = () => {
  const { 
    reservas, 
    atualizarReserva, 
    filtroLocalidade, 
    setFiltroLocalidade,
    filtroMes,
    setFiltroMes,
    filtroAno,
    setFiltroAno
  } = useReservas();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstoque, setFiltroEstoque] = useState<string>('Todos');
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [tipoAjuste, setTipoAjuste] = useState<TipoAjuste>('liberacao');
  const [quantidadeAjuste, setQuantidadeAjuste] = useState(0);
  const [novoSaldo, setNovoSaldo] = useState(0);
  const [justificativa, setJustificativa] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;

  // Localidades únicas para o filtro
  const localidades = useMemo(() => {
    const locs = new Set(reservas.map(r => r.localidade));
    return Array.from(locs).sort();
  }, [reservas]);

  // Filtrar reservas por localidade, mês e ano
  const reservasFiltradas = useMemo(() => {
    return reservas.filter(r => {
      const matchLocalidade = filtroLocalidade === 'Todos' || r.localidade === filtroLocalidade;
      const matchMes = filtroMes === 'Todos' || r.mes_referencia === filtroMes;
      const matchAno = r.ano_referencia === filtroAno;
      return matchLocalidade && matchMes && matchAno;
    });
  }, [reservas, filtroLocalidade, filtroMes, filtroAno]);

  // Calcular saldo consolidado por material
  const materiaisEmEstoque = useMemo(() => {
    const agrupado = reservasFiltradas.reduce((acc, r) => {
      const key = r.material_nome;
      if (!acc[key]) {
        acc[key] = {
          material_codigo: r.material_codigo,
          material_nome: r.material_nome,
          total_liberado: 0,
          total_utilizado: 0,
          saldo: 0,
          reserva_ids: [],
        };
      }
      acc[key].total_liberado += r.quantidade_liberada || 0;
      acc[key].total_utilizado += r.quantidade_utilizada || 0;
      acc[key].saldo = acc[key].total_liberado - acc[key].total_utilizado;
      acc[key].reserva_ids.push(r.id);
      return acc;
    }, {} as Record<string, MaterialEmEstoque>);

    return Object.values(agrupado)
      .filter(m => m.total_liberado > 0) // Só mostra materiais que já tiveram liberação
      .sort((a, b) => b.saldo - a.saldo);
  }, [reservasFiltradas]);

  // Função para determinar o status do saldo
  const getSaldoStatus = useCallback((saldo: number, totalLiberado: number) => {
    if (totalLiberado === 0) return 'high';
    const percentual = (saldo / totalLiberado) * 100;
    if (percentual <= 10) return 'low';
    if (percentual <= 30) return 'medium';
    return 'high';
  }, []);

  // Filtrar por busca e tipo de estoque
  const materiaisFiltrados = useMemo(() => {
    let resultado = materiaisEmEstoque;
    
    // Filtro por nível de estoque
    if (filtroEstoque !== 'Todos') {
      resultado = resultado.filter(m => {
        const status = getSaldoStatus(m.saldo, m.total_liberado);
        return status === filtroEstoque;
      });
    }
    
    // Filtro por busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      resultado = resultado.filter(m =>
        m.material_nome.toLowerCase().includes(termo) ||
        m.material_codigo.includes(searchTerm)
      );
    }
    
    return resultado;
  }, [materiaisEmEstoque, filtroEstoque, searchTerm, getSaldoStatus]);

  // Paginação
  const materiaisPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return materiaisFiltrados.slice(inicio, fim);
  }, [materiaisFiltrados, paginaAtual]);

  const totalPaginas = Math.ceil(materiaisFiltrados.length / itensPorPagina);

  // Reset página quando filtros mudam
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroEstoque, searchTerm, filtroMes, filtroAno, filtroLocalidade]);

  // Métricas de resumo
  const totalMateriais = materiaisFiltrados.length;
  const saldoTotal = materiaisFiltrados.reduce((acc, m) => acc + m.saldo, 0);

  // Handlers
  const handleEdit = (item: MaterialEmEstoque) => {
    setEditingItem(item);
    setTipoAjuste('liberacao');
    setQuantidadeAjuste(0);
    setNovoSaldo(item.saldo);
    setJustificativa('');
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setTipoAjuste('liberacao');
    setQuantidadeAjuste(0);
    setNovoSaldo(0);
    setJustificativa('');
  };

  // Calcular preview das alterações
  const calcularPreview = useCallback(() => {
    if (!editingItem) return null;
    
    let novoLiberado = editingItem.total_liberado;
    let novoUtilizado = editingItem.total_utilizado;
    
    switch (tipoAjuste) {
      case 'liberacao':
        novoLiberado += quantidadeAjuste;
        break;
      case 'utilizacao':
        novoUtilizado += quantidadeAjuste;
        break;
      case 'correcao':
        novoUtilizado = novoLiberado - novoSaldo;
        break;
    }
    
    return {
      liberado: { antes: editingItem.total_liberado, depois: novoLiberado },
      utilizado: { antes: editingItem.total_utilizado, depois: novoUtilizado },
      saldo: { antes: editingItem.saldo, depois: novoLiberado - novoUtilizado }
    };
  }, [editingItem, tipoAjuste, quantidadeAjuste, novoSaldo]);

  const preview = calcularPreview();

  // Validações
  const isValidAjuste = useMemo(() => {
    if (!preview) return false;
    if (tipoAjuste === 'liberacao' || tipoAjuste === 'utilizacao') {
      if (quantidadeAjuste <= 0) return false;
    }
    if (preview.saldo.depois < 0) return false;
    if (preview.utilizado.depois < 0) return false;
    return true;
  }, [preview, tipoAjuste, quantidadeAjuste]);

  const handleSave = async () => {
    if (!editingItem || editingItem.reserva_ids.length === 0 || !preview) return;

    setIsSaving(true);

    const primeiraReservaId = editingItem.reserva_ids[0];
    const reservaOriginal = reservas.find(r => r.id === primeiraReservaId);
    
    if (!reservaOriginal) {
      setIsSaving(false);
      return;
    }

    let updates: { quantidade_liberada?: number; quantidade_utilizada?: number; justificativa: string } = {
      justificativa: justificativa || getTipoAjusteDescricao(tipoAjuste),
    };

    switch (tipoAjuste) {
      case 'liberacao':
        updates.quantidade_liberada = (reservaOriginal.quantidade_liberada || 0) + quantidadeAjuste;
        break;
      case 'utilizacao':
        updates.quantidade_utilizada = (reservaOriginal.quantidade_utilizada || 0) + quantidadeAjuste;
        break;
      case 'correcao':
        const diferencaUtilizada = preview.utilizado.depois - editingItem.total_utilizado;
        updates.quantidade_utilizada = (reservaOriginal.quantidade_utilizada || 0) + diferencaUtilizada;
        break;
    }

    const sucesso = await atualizarReserva(primeiraReservaId, updates);

    setIsSaving(false);

    if (sucesso) {
      handleCloseModal();
    }
  };

  const getTipoAjusteDescricao = (tipo: TipoAjuste) => {
    switch (tipo) {
      case 'liberacao': return 'Liberação adicional de material';
      case 'utilizacao': return 'Registro de utilização em campo';
      case 'correcao': return 'Correção manual após conferência';
    }
  };

  // Handler para exportar PDF
  const handleExportPDF = async () => {
    const filters: Record<string, string> = {};
    
    if (filtroLocalidade !== 'Todos') {
      filters['Localidade'] = filtroLocalidade;
    }
    if (filtroMes !== 'Todos') {
      const mesLabel = mesesOptions.find(m => m.value === filtroMes)?.label || filtroMes;
      filters['Mês'] = mesLabel;
    }
    filters['Ano'] = String(filtroAno);
    if (filtroEstoque !== 'Todos') {
      const estoqueLabels: Record<string, string> = {
        'high': 'Estoque OK',
        'medium': 'Estoque Médio',
        'low': 'Estoque Baixo'
      };
      filters['Nível'] = estoqueLabels[filtroEstoque] || filtroEstoque;
    }
    if (searchTerm) {
      filters['Busca'] = searchTerm;
    }

    await exportToPDF({
      filename: 'estoque_materiais',
      title: 'Relatório de Materiais em Estoque',
      filters,
      data: materiaisFiltrados,
      columns: materiaisColumns,
    });
  };

  // Handler para exportar CSV
  const handleExportCSV = () => {
    const filters: Record<string, string> = {};
    
    if (filtroLocalidade !== 'Todos') {
      filters['Localidade'] = filtroLocalidade;
    }
    if (filtroMes !== 'Todos') {
      const mesLabel = mesesOptions.find(m => m.value === filtroMes)?.label || filtroMes;
      filters['Mês'] = mesLabel;
    }
    filters['Ano'] = String(filtroAno);
    if (filtroEstoque !== 'Todos') {
      const estoqueLabels: Record<string, string> = {
        'high': 'Estoque OK',
        'medium': 'Estoque Médio',
        'low': 'Estoque Baixo'
      };
      filters['Nível'] = estoqueLabels[filtroEstoque] || filtroEstoque;
    }
    if (searchTerm) {
      filters['Busca'] = searchTerm;
    }

    exportToCSV({
      filename: 'estoque_materiais',
      title: 'Relatório de Materiais em Estoque',
      filters,
      data: materiaisFiltrados,
      columns: materiaisColumns,
    });
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-foreground">Materiais em Estoque</h1>
          <p className="text-xs text-muted-foreground">
            Visualize o saldo atual de materiais disponíveis com a empreiteira
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
              <CardTitle className="text-xs font-medium">Total de Materiais</CardTitle>
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{totalMateriais}</div>
              <p className="text-[10px] text-muted-foreground">
                itens com saldo em estoque
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
              <CardTitle className="text-xs font-medium">Saldo Total</CardTitle>
              <Package className="h-3.5 w-3.5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-primary">{saldoTotal.toLocaleString('pt-BR')}</div>
              <p className="text-[10px] text-muted-foreground">
                unidades disponíveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
              <CardTitle className="text-xs font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive">
                {materiaisFiltrados.filter(m => getSaldoStatus(m.saldo, m.total_liberado) === 'low').length}
              </div>
              <p className="text-[10px] text-muted-foreground">
                itens com menos de 10% do estoque
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Estoque */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Package className="h-4 w-4 text-primary" />
                  Saldo por Material
                </CardTitle>
                {/* Legenda compacta */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> OK (&gt;30%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Médio (10-30%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> Baixo (&lt;10%)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={filtroMes} onValueChange={setFiltroMes}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent side="bottom" className="bg-popover">
                    {mesesOptions.map(m => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(filtroAno)} onValueChange={(v) => setFiltroAno(Number(v))}>
                  <SelectTrigger className="w-[90px] h-8 text-xs">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent side="bottom" className="bg-popover">
                    <SelectItem value="2026" className="text-xs">2026</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroEstoque} onValueChange={setFiltroEstoque}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent side="bottom" className="bg-popover">
                    <SelectItem value="Todos" className="text-xs">Todos</SelectItem>
                    <SelectItem value="high" className="text-xs">Estoque OK</SelectItem>
                    <SelectItem value="medium" className="text-xs">Estoque Médio</SelectItem>
                    <SelectItem value="low" className="text-xs">Estoque Baixo</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-56">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código ou nome..."
                    className="pl-7 h-8 text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {materiaisFiltrados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum material em estoque encontrado</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportCSV}
                      className="text-muted-foreground hover:text-primary"
                      title="Exportar para CSV"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      <span className="text-xs">Exportar CSV</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportPDF}
                      className="text-muted-foreground hover:text-primary"
                      title="Exportar para PDF"
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      <span className="text-xs">Exportar PDF</span>
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Mostrando {((paginaAtual - 1) * itensPorPagina) + 1}-{Math.min(paginaAtual * itensPorPagina, materiaisFiltrados.length)} de {materiaisFiltrados.length} itens
                  </span>
                </div>
                <Table key={`table-${filtroEstoque}-${searchTerm}-${paginaAtual}`}>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-medium py-2 text-xs">Código</TableHead>
                      <TableHead className="font-medium py-2 text-xs">Nome do Material</TableHead>
                      <TableHead className="font-medium py-2 text-xs text-center">Liberado</TableHead>
                      <TableHead className="font-medium py-2 text-xs text-center">Utilizado</TableHead>
                      <TableHead className="font-medium py-2 text-xs text-center">Saldo (Und.)</TableHead>
                      <TableHead className="font-medium py-2 text-xs text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materiaisPaginados.map((material) => {
                      const status = getSaldoStatus(material.saldo, material.total_liberado);
                      return (
                        <TableRow key={`${material.material_codigo}-${material.material_nome}`} className="hover:bg-muted/20">
                          <TableCell className="py-1.5 font-mono text-primary text-sm">
                            {material.material_codigo}
                          </TableCell>
                          <TableCell className="py-1.5 text-sm max-w-md truncate">
                            {material.material_nome}
                          </TableCell>
                          <TableCell className="py-1.5 text-sm text-center">
                            {material.total_liberado.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="py-1.5 text-sm text-center">
                            {material.total_utilizado.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="py-1.5 text-center">
                            <Badge
                              variant={status === 'low' ? 'destructive' : status === 'medium' ? 'secondary' : 'default'}
                              className="min-w-14 justify-center text-xs h-5"
                            >
                              {material.saldo.toLocaleString('pt-BR')}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1.5 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEdit(material)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {totalPaginas > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                          className={paginaAtual === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        let pageNum: number;
                        if (totalPaginas <= 5) {
                          pageNum = i + 1;
                        } else if (paginaAtual <= 3) {
                          pageNum = i + 1;
                        } else if (paginaAtual >= totalPaginas - 2) {
                          pageNum = totalPaginas - 4 + i;
                        } else {
                          pageNum = paginaAtual - 2 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPaginaAtual(pageNum)}
                              isActive={paginaAtual === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                          className={paginaAtual === totalPaginas ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Modal de Edição */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Ajustar Estoque
            </DialogTitle>
            <DialogDescription>
              Registre liberações, utilizações ou faça correções manuais
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              {/* Informações do Material */}
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="font-medium text-sm">{editingItem.material_nome}</p>
                <p className="text-xs text-muted-foreground font-mono">Código: {editingItem.material_codigo}</p>
              </div>

              {/* Valores Atuais */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Liberado</p>
                  <p className="text-base font-bold">{editingItem.total_liberado.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Utilizado</p>
                  <p className="text-base font-bold">{editingItem.total_utilizado.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Saldo Atual</p>
                  <p className="text-base font-bold text-primary">{editingItem.saldo.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Tipo de Ajuste */}
              <div className="space-y-2">
                <Label>Tipo de Ajuste</Label>
                <Select value={tipoAjuste} onValueChange={(v) => setTipoAjuste(v as TipoAjuste)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="liberacao">
                      <div className="flex items-center gap-2">
                        <Plus className="h-3.5 w-3.5 text-chart-1" />
                        <span>Adicionar Liberação (+Recebimento)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="utilizacao">
                      <div className="flex items-center gap-2">
                        <Minus className="h-3.5 w-3.5 text-destructive" />
                        <span>Registrar Utilização (+Baixa)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="correcao">
                      <div className="flex items-center gap-2">
                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Correção Manual (Ajustar Saldo)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Input de Quantidade ou Novo Saldo */}
              {tipoAjuste === 'correcao' ? (
                <div className="space-y-2">
                  <Label htmlFor="novoSaldo">Novo Saldo Desejado</Label>
                  <Input
                    id="novoSaldo"
                    type="number"
                    min={0}
                    max={editingItem.total_liberado}
                    value={novoSaldo}
                    onChange={(e) => setNovoSaldo(Math.max(0, Math.min(editingItem.total_liberado, parseInt(e.target.value) || 0)))}
                    className="text-center text-lg font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="quantidadeAjuste">
                    {tipoAjuste === 'liberacao' ? 'Quantidade a Liberar' : 'Quantidade Utilizada'}
                  </Label>
                  <Input
                    id="quantidadeAjuste"
                    type="number"
                    min={1}
                    max={tipoAjuste === 'utilizacao' ? editingItem.saldo : undefined}
                    value={quantidadeAjuste || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (tipoAjuste === 'utilizacao') {
                        setQuantidadeAjuste(Math.max(0, Math.min(editingItem.saldo, val)));
                      } else {
                        setQuantidadeAjuste(Math.max(0, val));
                      }
                    }}
                    placeholder="Digite a quantidade..."
                    className="text-center text-lg font-bold"
                  />
                </div>
              )}

              {/* Preview */}
              {preview && (tipoAjuste === 'correcao' ? novoSaldo !== editingItem.saldo : quantidadeAjuste > 0) && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Preview das alterações:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-muted-foreground">{preview.liberado.antes.toLocaleString('pt-BR')}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className={preview.liberado.depois !== preview.liberado.antes ? "font-bold text-chart-1" : ""}>
                        {preview.liberado.depois.toLocaleString('pt-BR')}
                      </span>
                      {preview.liberado.depois !== preview.liberado.antes && (
                        <span className="text-chart-1 text-[10px]">
                          (+{(preview.liberado.depois - preview.liberado.antes).toLocaleString('pt-BR')})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-muted-foreground">{preview.utilizado.antes.toLocaleString('pt-BR')}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className={preview.utilizado.depois !== preview.utilizado.antes ? "font-bold text-destructive" : ""}>
                        {preview.utilizado.depois.toLocaleString('pt-BR')}
                      </span>
                      {preview.utilizado.depois !== preview.utilizado.antes && (
                        <span className="text-destructive text-[10px]">
                          (+{(preview.utilizado.depois - preview.utilizado.antes).toLocaleString('pt-BR')})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-muted-foreground">{preview.saldo.antes.toLocaleString('pt-BR')}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className={`font-bold ${preview.saldo.depois > preview.saldo.antes ? 'text-chart-1' : preview.saldo.depois < preview.saldo.antes ? 'text-destructive' : ''}`}>
                        {preview.saldo.depois.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground text-center">
                    <span>Liberado</span>
                    <span>Utilizado</span>
                    <span>Saldo</span>
                  </div>
                </div>
              )}

              {/* Validação de erro */}
              {preview && preview.saldo.depois < 0 && (
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>O saldo não pode ficar negativo</span>
                </div>
              )}

              {/* Justificativa */}
              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa (opcional)</Label>
                <Textarea
                  id="justificativa"
                  placeholder="Ex: Recebimento de material adicional, conferência física..."
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !isValidAjuste}>
              {isSaving ? 'Salvando...' : 'Salvar Ajuste'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MateriaisPage;
