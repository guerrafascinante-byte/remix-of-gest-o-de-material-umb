import { useState, useCallback, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, TrendingDown, Pencil, Plus, Minus, Edit, ArrowRight } from 'lucide-react';
import { useReservas } from '@/hooks/useReservas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TipoAjuste = 'liberacao' | 'utilizacao' | 'correcao';

interface DivergenciaItem {
  id: string;
  material: string;
  localidade: string;
  mes: string;
  liberado: number;
  utilizado: number;
  saldo: number;
  divergencia: number;
}

const tipoAjusteOptions = [
  { 
    value: 'liberacao' as TipoAjuste, 
    label: 'Adicionar Liberação', 
    sublabel: '+Recebimento',
    icon: Plus,
    description: 'Registrar material recebido da EMBASA'
  },
  { 
    value: 'utilizacao' as TipoAjuste, 
    label: 'Registrar Utilização', 
    sublabel: '+Baixa',
    icon: Minus,
    description: 'Registrar material utilizado em obra'
  },
  { 
    value: 'correcao' as TipoAjuste, 
    label: 'Correção Manual', 
    sublabel: 'Ajustar Saldo',
    icon: Edit,
    description: 'Corrigir saldo após conferência física'
  },
];

const DivergenciasPage = () => {
  const { 
    reservasFiltradas, 
    filtroLocalidade, 
    setFiltroLocalidade, 
    filtroMes, 
    setFiltroMes,
    atualizarReserva 
  } = useReservas();

  const [editingItem, setEditingItem] = useState<DivergenciaItem | null>(null);
  const [tipoAjuste, setTipoAjuste] = useState<TipoAjuste>('liberacao');
  const [quantidadeAjuste, setQuantidadeAjuste] = useState(0);
  const [novoSaldo, setNovoSaldo] = useState(0);
  const [justificativa, setJustificativa] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filtra materiais onde utilizado > liberado (divergência negativa para EMBASA)
  const materiaisComDivergencia = reservasFiltradas
    .filter(r => r.quantidade_utilizada > r.quantidade_liberada)
    .map(r => ({
      id: r.id,
      material: r.material_nome,
      localidade: r.localidade,
      mes: r.mes_referencia,
      liberado: r.quantidade_liberada,
      utilizado: r.quantidade_utilizada,
      saldo: r.quantidade_liberada - r.quantidade_utilizada,
      divergencia: r.quantidade_utilizada - r.quantidade_liberada,
    }))
    .sort((a, b) => b.divergencia - a.divergencia);

  const totalDivergencia = materiaisComDivergencia.reduce((acc, m) => acc + m.divergencia, 0);
  const totalItens = materiaisComDivergencia.length;

  const getMesLabel = (mes: string) => {
    const meses: Record<string, string> = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março',
      '04': 'Abril', '05': 'Maio', '06': 'Junho',
      '07': 'Julho', '08': 'Agosto', '09': 'Setembro',
      '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
    };
    return meses[mes] || mes;
  };

  const getSeverity = (divergencia: number): 'high' | 'medium' | 'low' => {
    if (divergencia >= 50) return 'high';
    if (divergencia >= 10) return 'medium';
    return 'low';
  };

  const calcularPreview = useCallback(() => {
    if (!editingItem) return null;

    let novoLiberado = editingItem.liberado;
    let novoUtilizado = editingItem.utilizado;

    switch (tipoAjuste) {
      case 'liberacao':
        novoLiberado = editingItem.liberado + quantidadeAjuste;
        break;
      case 'utilizacao':
        novoUtilizado = editingItem.utilizado + quantidadeAjuste;
        break;
      case 'correcao':
        novoUtilizado = novoLiberado - novoSaldo;
        break;
    }

    return {
      liberado: { antes: editingItem.liberado, depois: novoLiberado },
      utilizado: { antes: editingItem.utilizado, depois: novoUtilizado },
      saldo: { antes: editingItem.saldo, depois: novoLiberado - novoUtilizado },
    };
  }, [editingItem, tipoAjuste, quantidadeAjuste, novoSaldo]);

  const preview = calcularPreview();

  const isValidAjuste = useMemo(() => {
    if (!preview) return false;
    if (tipoAjuste === 'liberacao' || tipoAjuste === 'utilizacao') {
      if (quantidadeAjuste <= 0) return false;
    }
    // Permitir saldo negativo em correções (divergência já existe)
    return true;
  }, [preview, tipoAjuste, quantidadeAjuste]);

  const handleEdit = (item: DivergenciaItem) => {
    setEditingItem(item);
    setTipoAjuste('liberacao'); // Default para adicionar liberação (resolve divergência)
    setQuantidadeAjuste(item.divergencia); // Sugere a quantidade necessária para zerar
    setNovoSaldo(0); // Para correção manual, sugere saldo 0
    setJustificativa('');
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setQuantidadeAjuste(0);
    setNovoSaldo(0);
    setJustificativa('');
  };

  const getTipoAjusteDescricao = (tipo: TipoAjuste) => {
    switch (tipo) {
      case 'liberacao': return 'Liberação adicionada';
      case 'utilizacao': return 'Utilização registrada';
      case 'correcao': return 'Correção manual de saldo';
    }
  };

  const handleSave = async () => {
    if (!editingItem || !preview) return;

    setIsSaving(true);

    let updates: { quantidade_liberada?: number; quantidade_utilizada?: number; justificativa?: string } = {};

    switch (tipoAjuste) {
      case 'liberacao':
        updates.quantidade_liberada = preview.liberado.depois;
        break;
      case 'utilizacao':
        updates.quantidade_utilizada = preview.utilizado.depois;
        break;
      case 'correcao':
        updates.quantidade_utilizada = preview.utilizado.depois;
        break;
    }

    updates.justificativa = justificativa || getTipoAjusteDescricao(tipoAjuste);

    const sucesso = await atualizarReserva(editingItem.id, updates);
    setIsSaving(false);

    if (sucesso) {
      handleCloseModal();
    }
  };

  return (
    <Layout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">Divergências</h1>
              <p className="text-[10px] text-muted-foreground">
                Materiais com utilização superior ao liberado pela EMBASA
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Select value={filtroLocalidade} onValueChange={setFiltroLocalidade}>
            <SelectTrigger className="w-[130px] h-7 text-xs">
              <SelectValue placeholder="Localidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todas</SelectItem>
              <SelectItem value="Salvador">Salvador</SelectItem>
              <SelectItem value="Lauro">Lauro de Freitas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="w-[130px] h-7 text-xs">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os meses</SelectItem>
              <SelectItem value="01">Janeiro</SelectItem>
              <SelectItem value="02">Fevereiro</SelectItem>
              <SelectItem value="03">Março</SelectItem>
              <SelectItem value="04">Abril</SelectItem>
              <SelectItem value="05">Maio</SelectItem>
              <SelectItem value="06">Junho</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Materiais com Divergência</p>
                  <p className="text-lg font-bold text-destructive">{totalItens}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-destructive/10 rounded-lg">
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total em Divergência (Und.)</p>
                  <p className="text-lg font-bold text-destructive">+{totalDivergencia.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              Detalhamento por Material
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {materiaisComDivergencia.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhuma divergência encontrada</p>
                <p className="text-[10px] mt-0.5">Todos os materiais estão dentro do limite liberado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Material</TableHead>
                    <TableHead className="text-xs">Localidade</TableHead>
                    <TableHead className="text-xs">Mês</TableHead>
                    <TableHead className="text-xs text-right">Liberado (Und.)</TableHead>
                    <TableHead className="text-xs text-right">Utilizado (Und.)</TableHead>
                    <TableHead className="text-xs text-right">Divergência</TableHead>
                    <TableHead className="text-xs text-center w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiaisComDivergencia.map((item) => {
                    const severity = getSeverity(item.divergencia);
                    return (
                      <TableRow key={item.id} className="hover:bg-destructive/5">
                        <TableCell className="text-xs font-medium max-w-[250px] truncate" title={item.material}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${
                              severity === 'high' ? 'text-destructive' : 
                              severity === 'medium' ? 'text-chart-2' : 'text-chart-3'
                            }`} />
                            <span className="truncate">{item.material}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{item.localidade}</TableCell>
                        <TableCell className="text-xs">{getMesLabel(item.mes)}</TableCell>
                        <TableCell className="text-xs text-right">{item.liberado.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-xs text-right">{item.utilizado.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-xs text-right">
                          <Badge 
                            variant="destructive" 
                            className="font-mono text-xs"
                          >
                            +{item.divergencia.toLocaleString('pt-BR')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(item)}
                            title="Editar quantidade utilizada"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Legenda */}
        {materiaisComDivergencia.length > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-4 px-1">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              Alta (&gt;50 und.)
            </span>
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-chart-2" />
              Média (10-50 und.)
            </span>
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-chart-3" />
              Baixa (&lt;10 und.)
            </span>
          </div>
        )}

        {/* Modal de Ajuste */}
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && handleCloseModal()}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Ajustar Divergência
              </DialogTitle>
              <DialogDescription>
                Registre liberações, utilizações ou faça correções para resolver a divergência
              </DialogDescription>
            </DialogHeader>

            {editingItem && (
              <div className="space-y-3 py-2 overflow-y-auto flex-1 pr-1">
                {/* Material Info */}
                <div className="p-2 bg-muted/50 rounded-lg space-y-1">
                  <div>
                    <Label className="text-xs text-muted-foreground">Material</Label>
                    <p className="text-sm font-medium">{editingItem.material}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Localidade</Label>
                      <p className="text-sm">{editingItem.localidade}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Mês</Label>
                      <p className="text-sm">{getMesLabel(editingItem.mes)}</p>
                    </div>
                  </div>
                </div>

                {/* Valores Atuais */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-muted/30 rounded border text-center">
                    <Label className="text-xs text-muted-foreground">Liberado</Label>
                    <p className="text-lg font-mono font-semibold">{editingItem.liberado.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded border text-center">
                    <Label className="text-xs text-muted-foreground">Utilizado</Label>
                    <p className="text-lg font-mono font-semibold">{editingItem.utilizado.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded border border-destructive/30 text-center">
                    <Label className="text-xs text-muted-foreground">Saldo</Label>
                    <p className="text-lg font-mono font-semibold text-destructive">{editingItem.saldo.toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                {/* Tipo de Ajuste */}
                <div>
                  <Label className="text-xs">Tipo de Ajuste</Label>
                  <Select value={tipoAjuste} onValueChange={(v) => setTipoAjuste(v as TipoAjuste)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoAjusteOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" />
                              <span>{opt.label}</span>
                              <span className="text-muted-foreground text-xs">({opt.sublabel})</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tipoAjusteOptions.find(o => o.value === tipoAjuste)?.description}
                  </p>
                </div>

                {/* Input de Quantidade ou Saldo */}
                {tipoAjuste === 'correcao' ? (
                  <div>
                    <Label htmlFor="novoSaldo" className="text-xs">Novo Saldo Desejado</Label>
                    <Input
                      id="novoSaldo"
                      type="number"
                      value={novoSaldo}
                      onChange={(e) => setNovoSaldo(Number(e.target.value))}
                      className="mt-1 font-mono"
                      placeholder="Ex: 0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      O sistema ajustará o "Utilizado" para atingir este saldo
                    </p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="quantidade" className="text-xs">
                      {tipoAjuste === 'liberacao' ? 'Quantidade a Liberar' : 'Quantidade Utilizada'}
                    </Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min={0}
                      value={quantidadeAjuste}
                      onChange={(e) => setQuantidadeAjuste(Number(e.target.value))}
                      className="mt-1 font-mono"
                      placeholder="Ex: 10"
                    />
                  </div>
                )}

                {/* Preview das Alterações */}
                {preview && (
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <Label className="text-xs text-muted-foreground mb-2 block">Preview das Alterações</Label>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Liberado</p>
                        <div className="flex items-center justify-center gap-1 text-sm font-mono">
                          <span>{preview.liberado.antes}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className={preview.liberado.depois !== preview.liberado.antes ? 'text-chart-4 font-semibold' : ''}>
                            {preview.liberado.depois}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Utilizado</p>
                        <div className="flex items-center justify-center gap-1 text-sm font-mono">
                          <span>{preview.utilizado.antes}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className={preview.utilizado.depois !== preview.utilizado.antes ? 'text-chart-2 font-semibold' : ''}>
                            {preview.utilizado.depois}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Saldo</p>
                        <div className="flex items-center justify-center gap-1 text-sm font-mono">
                          <span className="text-destructive">{preview.saldo.antes}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className={preview.saldo.depois >= 0 ? 'text-chart-4 font-semibold' : 'text-destructive font-semibold'}>
                            {preview.saldo.depois}
                          </span>
                        </div>
                      </div>
                    </div>
                    {preview.saldo.depois >= 0 && preview.saldo.antes < 0 && (
                      <Badge variant="secondary" className="mt-2 bg-chart-4/10 text-chart-4 w-full justify-center">
                        ✓ Divergência será resolvida
                      </Badge>
                    )}
                  </div>
                )}

                {/* Justificativa */}
                <div>
                  <Label htmlFor="justificativa" className="text-xs">Justificativa (opcional)</Label>
                  <Textarea
                    id="justificativa"
                    placeholder="Ex: Material recebido sem registro no sistema..."
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    className="mt-1 min-h-[50px] text-sm"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCloseModal} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !isValidAjuste}>
                {isSaving ? 'Salvando...' : 'Salvar Ajuste'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DivergenciasPage;
