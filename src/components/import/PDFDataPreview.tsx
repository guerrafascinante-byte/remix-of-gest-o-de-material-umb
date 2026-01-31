import { useState, useMemo } from 'react';
import { ArrowLeft, Check, Pencil, Save, X, AlertTriangle, FileText, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExtractedItem {
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade_solicitada: number;
  quantidade_fornecida: number;
  valor_total?: number;
  aprovado: boolean;
}

interface ExtractedMetadata {
  numero_reserva: string;
  data: string;
  localidade: string;
  responsavel: string;
  deposito: string;
}

interface ExtractedData {
  items: ExtractedItem[];
  metadata: ExtractedMetadata;
}

interface PDFDataPreviewProps {
  data: ExtractedData;
  tipoImportacao: 'solicitacao' | 'liberacao' | 'utilizacao';
  localidade: string;
  mesReferencia: string;
  empreiteira: string;
  fileName: string;
  onConfirm: (selectedItems: ExtractedItem[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const tipoLabels: Record<string, string> = {
  solicitacao: 'Solicitação',
  liberacao: 'Liberação',
  utilizacao: 'Utilização',
};

const mesesLabels: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

export const PDFDataPreview = ({
  data,
  tipoImportacao,
  localidade,
  mesReferencia,
  empreiteira,
  fileName,
  onConfirm,
  onCancel,
  isLoading = false,
}: PDFDataPreviewProps) => {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<(ExtractedItem & { selected: boolean })[]>(
    data.items.map((item) => ({ ...item, selected: item.aprovado }))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExtractedItem>>({});

  const { approvedItems, rejectedItems, selectedCount } = useMemo(() => {
    const approved = items.filter((i) => i.aprovado);
    const rejected = items.filter((i) => !i.aprovado);
    const selected = items.filter((i) => i.selected).length;
    return { approvedItems: approved, rejectedItems: rejected, selectedCount: selected };
  }, [items]);

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleAll = (checked: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: item.aprovado ? checked : item.selected })));
  };

  const startEditing = (index: number) => {
    const item = items[index];
    setEditForm({
      codigo: item.codigo,
      descricao: item.descricao,
      quantidade_fornecida: item.quantidade_fornecida,
    });
    setEditingIndex(index);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === editingIndex
          ? {
              ...item,
              codigo: editForm.codigo || item.codigo,
              descricao: editForm.descricao || item.descricao,
              quantidade_fornecida: editForm.quantidade_fornecida ?? item.quantidade_fornecida,
            }
          : item
      )
    );
    setEditingIndex(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  const handleConfirm = () => {
    const selectedItems = items.filter((i) => i.selected);
    onConfirm(selectedItems);
  };

  // Mobile Card Item Component
  const MobileItemCard = ({ item, index }: { item: ExtractedItem & { selected: boolean }; index: number }) => {
    const isEditing = editingIndex === index;
    
    if (isEditing) {
      return (
        <Card className="overflow-hidden">
          <CardContent className="p-3 space-y-2">
            <Input
              value={editForm.codigo || ''}
              onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
              placeholder="Código"
              className="h-10 text-sm"
            />
            <Input
              value={editForm.descricao || ''}
              onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
              placeholder="Descrição"
              className="h-10 text-sm"
            />
            <Input
              type="number"
              value={editForm.quantidade_fornecida || ''}
              onChange={(e) => setEditForm({ ...editForm, quantidade_fornecida: Number(e.target.value) })}
              placeholder="Quantidade"
              className="h-10 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} className="flex-1 h-9">
                <Save className="h-4 w-4 mr-1" /> Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1 h-9">
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className={`overflow-hidden ${!item.selected ? 'opacity-50' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Checkbox
              checked={item.selected}
              onCheckedChange={() => toggleItem(index)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-primary">{item.codigo}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => startEditing(index)} className="gap-2 text-sm">
                      <Pencil className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-foreground mt-0.5 line-clamp-2">{item.descricao}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Qtd: <span className="font-semibold text-foreground">{item.quantidade_fornecida}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileText className="h-4 w-4 md:h-5 md:w-5" />
              Dados Extraídos
            </CardTitle>
            <CardDescription className="mt-1 text-xs md:text-sm">
              Revise os dados antes de importar
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onCancel} className="h-9 md:h-8 w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Badges - Scroll horizontal on mobile */}
        <div className="flex gap-1.5 md:gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          <Badge variant="secondary" className="text-[10px] md:text-xs flex-shrink-0">{fileName.slice(0, 20)}{fileName.length > 20 ? '...' : ''}</Badge>
          <Badge variant="outline" className="text-[10px] md:text-xs flex-shrink-0">{tipoLabels[tipoImportacao]}</Badge>
          <Badge variant="outline" className="text-[10px] md:text-xs flex-shrink-0">{localidade}</Badge>
          <Badge variant="outline" className="text-[10px] md:text-xs flex-shrink-0">{mesesLabels[mesReferencia]}</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
        {/* Metadata Section */}
        {data.metadata && (
          <div className="bg-muted/50 rounded-lg p-3 md:p-4 space-y-2">
            <h4 className="font-medium text-xs md:text-sm">Metadados Detectados</h4>
            <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
              {data.metadata.numero_reserva && (
                <div>
                  <span className="text-muted-foreground">Reserva:</span>{' '}
                  <span className="font-medium">{data.metadata.numero_reserva}</span>
                </div>
              )}
              {data.metadata.data && (
                <div>
                  <span className="text-muted-foreground">Data:</span>{' '}
                  <span className="font-medium">{data.metadata.data}</span>
                </div>
              )}
              {data.metadata.localidade && (
                <div>
                  <span className="text-muted-foreground">Local:</span>{' '}
                  <span className="font-medium">{data.metadata.localidade}</span>
                </div>
              )}
              {data.metadata.responsavel && (
                <div className="col-span-2 md:col-span-1">
                  <span className="text-muted-foreground">Resp:</span>{' '}
                  <span className="font-medium truncate">{data.metadata.responsavel}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
          <span>
            <strong>{approvedItems.length}</strong> aprovados
          </span>
          {rejectedItems.length > 0 && (
            <span className="text-destructive">
              <strong>{rejectedItems.length}</strong> rejeitados
            </span>
          )}
          <Separator orientation="vertical" className="h-4 hidden md:block" />
          <span className="text-primary">
            <strong>{selectedCount}</strong> selecionados
          </span>
        </div>

        {/* Approved Items */}
        {approvedItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-xs md:text-sm">Itens Aprovados</h4>
              <label className="flex items-center gap-2 text-xs md:text-sm cursor-pointer">
                <Checkbox
                  checked={approvedItems.every((i) => i.selected)}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                />
                <span className="hidden sm:inline">Selecionar todos</span>
                <span className="sm:hidden">Todos</span>
              </label>
            </div>
            
            {/* Mobile: Card layout */}
            {isMobile ? (
              <div className="space-y-2">
                {items.map((item, index) => {
                  if (!item.aprovado) return null;
                  return <MobileItemCard key={index} item={item} index={index} />;
                })}
              </div>
            ) : (
              /* Desktop: Table layout */
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-24">Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-20 text-right">Qtd</TableHead>
                      <TableHead className="w-16 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      if (!item.aprovado) return null;
                      const isEditing = editingIndex === index;

                      return (
                        <TableRow key={index} className={!item.selected ? 'opacity-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={() => toggleItem(index)}
                            />
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editForm.codigo || ''}
                                onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
                                className="h-8 w-full"
                              />
                            ) : (
                              <span className="font-mono text-xs">{item.codigo}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editForm.descricao || ''}
                                onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                                className="h-8 w-full"
                              />
                            ) : (
                              <span className="text-sm">{item.descricao}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editForm.quantidade_fornecida || ''}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, quantidade_fornecida: Number(e.target.value) })
                                }
                                className="h-8 w-20 text-right"
                              />
                            ) : (
                              <span className="font-medium">{item.quantidade_fornecida}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEdit}>
                                  <Save className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => startEditing(index)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Rejected Items */}
        {rejectedItems.length > 0 && (
          <div>
            <Alert variant="default" className="mb-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs md:text-sm">
                Itens "Não Aprovados" não serão importados.
              </AlertDescription>
            </Alert>
            
            {isMobile ? (
              <div className="space-y-2">
                {rejectedItems.map((item, index) => (
                  <Card key={index} className="overflow-hidden bg-muted/30">
                    <CardContent className="p-3">
                      <p className="font-mono text-xs text-muted-foreground">{item.codigo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.descricao}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Qtd: {item.quantidade_solicitada}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-muted/30">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-20 text-right">Qtd Solic.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedItems.map((item, index) => (
                      <TableRow key={index} className="text-muted-foreground">
                        <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                        <TableCell className="text-sm">{item.descricao}</TableCell>
                        <TableCell className="text-right">{item.quantidade_solicitada}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Actions - Full width on mobile */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-3 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading} className="h-10 md:h-9">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selectedCount === 0 || isLoading} className="h-10 md:h-9">
            {isLoading ? (
              <>Importando...</>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Importar ({selectedCount})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
