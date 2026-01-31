import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, FileSpreadsheet, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ImportPreviewProps {
  data: any[];
  fileName: string;
  tipoImportacao: 'solicitacao' | 'liberacao' | 'utilizacao';
  localidade: string;
  mesReferencia: string;
  empreiteira: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Colunas esperadas para cada tipo
const colunasEsperadas = {
  solicitacao: ['Material/Nome', 'Quantidade'],
  liberacao: ['Material/Nome', 'Quantidade'],
  utilizacao: ['Material/Nome', 'Quantidade Utilizada'],
};

// Mapeamento de colunas conhecidas (incluindo variações do CSV exportado)
const colunasConhecidas = [
  'Nome_material', 'Nome material', 'Nome', 'nome', 'NOME', 'NOME_MATERIAL',
  'Descrição', 'Texto breve material', 'Material',
  'Quantidade', 'quantidade', 'QTD', 'Qtd', 'Qtd.necessária',
  'Quantidade Utilizada', 'quantidade_utilizada', 'Total Utilizado',
  'Código SAP', 'Codigo SAP', 'CODIGO SAP', 'Código', 'CODIGO', 'Nº material',
  'Reserva', 'reserva', 'Nº reserva', 'Numero da reserva', 'Número da reserva',
  'Saldo', 'saldo', 'SALDO',
];

const mesesLabel: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

const tipoLabel: Record<string, string> = {
  solicitacao: 'Solicitação',
  liberacao: 'Liberação',
  utilizacao: 'Utilização',
};

export const ImportPreview = ({
  data,
  fileName,
  tipoImportacao,
  localidade,
  mesReferencia,
  empreiteira,
  onConfirm,
  onCancel,
  isLoading = false,
}: ImportPreviewProps) => {
  // Análise das colunas detectadas
  const analise = useMemo(() => {
    if (data.length === 0) {
      return { colunas: [], colunasValidas: [], colunasDesconhecidas: [], registrosValidos: 0 };
    }

    const colunas = Object.keys(data[0]);
    const colunasValidas = colunas.filter(col => 
      colunasConhecidas.some(known => 
        col.toLowerCase().includes(known.toLowerCase()) || known.toLowerCase().includes(col.toLowerCase())
      )
    );
    const colunasDesconhecidas = colunas.filter(col => !colunasValidas.includes(col));

    // Verificar registros válidos (com nome de material e quantidade)
    const registrosValidos = data.filter(row => {
      const temNome = colunas.some(col => {
        const colLower = col.toLowerCase();
        return (colLower.includes('nome') || colLower.includes('material') || colLower.includes('descri')) && row[col];
      });
      
      // Para tipo "utilizacao", aceitar especificamente "Quantidade Utilizada"
      const temQtd = colunas.some(col => {
        const colLower = col.toLowerCase();
        const valor = row[col];
        
        // Para utilizacao, priorizar coluna "Quantidade Utilizada"
        if (tipoImportacao === 'utilizacao') {
          if (colLower === 'quantidade utilizada' || colLower.includes('utilizada') || colLower.includes('total utilizado')) {
            return !isNaN(Number(valor)) && Number(valor) > 0;
          }
        }
        
        // Fallback para coluna "Quantidade" genérica
        return (colLower.includes('qtd') || colLower === 'quantidade') && !isNaN(Number(valor)) && Number(valor) > 0;
      });
      
      return temNome && temQtd;
    }).length;

    return { colunas, colunasValidas, colunasDesconhecidas, registrosValidos };
  }, [data]);

  // Primeiras 10 linhas para preview
  const previewData = useMemo(() => data.slice(0, 10), [data]);

  // Colunas para exibir na tabela (máximo 5)
  const displayColumns = useMemo(() => {
    // Para utilizacao, priorizar "Quantidade Utilizada"
    const priorityColumns = tipoImportacao === 'utilizacao'
      ? [
          'Nome_material', 'Nome material', 'Nome', 'Material', 'Texto breve material',
          'Quantidade Utilizada', 'quantidade_utilizada', 'Total Utilizado',
          'Código SAP', 'Codigo SAP', 'Código',
        ]
      : [
          'Nome_material', 'Nome material', 'Nome', 'Material', 'Texto breve material',
          'Quantidade', 'quantidade', 'QTD', 'Qtd',
          'Código SAP', 'Codigo SAP', 'Código',
        ];

    const cols = analise.colunas.filter(col => 
      priorityColumns.some(p => col.toLowerCase().includes(p.toLowerCase()))
    );

    // Se não encontrar colunas prioritárias, usar as primeiras 5
    if (cols.length === 0) {
      return analise.colunas.slice(0, 5);
    }

    return cols.slice(0, 5);
  }, [analise.colunas, tipoImportacao]);

  const isValid = analise.registrosValidos > 0;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-sm font-medium">Preview da Importação</CardTitle>
              <CardDescription className="text-xs">{fileName}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {tipoLabel[tipoImportacao]}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {localidade}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {mesesLabel[mesReferencia]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4">
        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-accent/50 rounded-lg border">
            <p className="text-xs text-muted-foreground">Total de Linhas</p>
            <p className="text-lg font-semibold">{data.length}</p>
          </div>
          <div className="p-3 bg-accent/50 rounded-lg border">
            <p className="text-xs text-muted-foreground">Registros Válidos</p>
            <p className="text-lg font-semibold text-chart-1">{analise.registrosValidos}</p>
          </div>
          <div className="p-3 bg-accent/50 rounded-lg border">
            <p className="text-xs text-muted-foreground">Colunas Detectadas</p>
            <p className="text-lg font-semibold">{analise.colunas.length}</p>
          </div>
          <div className="p-3 bg-accent/50 rounded-lg border">
            <p className="text-xs text-muted-foreground">Empreiteira</p>
            <p className="text-xs font-medium truncate">{empreiteira}</p>
          </div>
        </div>

        {/* Validação de colunas */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Colunas Identificadas</p>
          <div className="flex flex-wrap gap-1.5">
            {analise.colunasValidas.map(col => (
              <Badge key={col} variant="default" className="text-xs gap-1">
                <CheckCircle className="h-3 w-3" />
                {col}
              </Badge>
            ))}
            {analise.colunasDesconhecidas.slice(0, 5).map(col => (
              <Badge key={col} variant="outline" className="text-xs text-muted-foreground">
                {col}
              </Badge>
            ))}
            {analise.colunasDesconhecidas.length > 5 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{analise.colunasDesconhecidas.length - 5} outras
              </Badge>
            )}
          </div>
        </div>

        {/* Alertas */}
        {!isValid && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p className="text-xs">
              Nenhum registro válido encontrado. Verifique se o arquivo contém colunas de "Nome/Material" e "Quantidade".
            </p>
          </div>
        )}

        {isValid && analise.registrosValidos < data.length && (
          <div className="flex items-center gap-2 p-3 bg-chart-4/10 text-chart-4 rounded-lg border border-chart-4/20">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p className="text-xs">
              {data.length - analise.registrosValidos} registro(s) serão ignorados por falta de dados obrigatórios.
            </p>
          </div>
        )}

        {/* Preview da tabela */}
        <div className="space-y-2">
          <p className="text-xs font-medium">
            Prévia dos Dados ({Math.min(10, data.length)} de {data.length} linhas)
          </p>
          <ScrollArea className="h-[200px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-xs">#</TableHead>
                  {displayColumns.map(col => (
                    <TableHead key={col} className="text-xs">{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    {displayColumns.map(col => (
                      <TableCell key={col} className="text-xs max-w-[150px] truncate">
                        {String(row[col] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {data.length > 10 && (
            <p className="text-xs text-muted-foreground text-center">
              ... e mais {data.length - 10} linhas
            </p>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={!isValid || isLoading}
            className="flex-1 gap-1.5"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isLoading ? 'Importando...' : `Confirmar Importação (${analise.registrosValidos} registros)`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
