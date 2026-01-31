import { useState, useCallback } from 'react';
import { FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using local package (Vite-compatible)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

type TipoImportacao = 'solicitacao' | 'liberacao' | 'utilizacao';

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

interface PDFUploadProps {
  onDataExtracted: (
    data: ExtractedData,
    tipoImportacao: TipoImportacao,
    localidade: string,
    mesReferencia: string,
    empreiteira: string,
    fileName: string
  ) => void;
}

const mesesOptions = [
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

export const PDFUpload = ({ onDataExtracted }: PDFUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [tipoImportacao, setTipoImportacao] = useState<TipoImportacao>('liberacao');
  const [localidade, setLocalidade] = useState('');
  const [mesReferencia, setMesReferencia] = useState('');
  const [empreiteira, setEmpreiteira] = useState('Consórcio Nova Bolandeira II');

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Apenas arquivos PDF são aceitos');
      return;
    }

    if (!localidade || !mesReferencia) {
      setError('Selecione a localidade e o mês de referência antes de fazer upload');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setFileName(file.name);

    try {
      // Extract text from PDF
      const pdfText = await extractTextFromPDF(file);
      
      if (!pdfText.trim()) {
        throw new Error('Não foi possível extrair texto do PDF. O arquivo pode estar protegido ou ser uma imagem.');
      }

      // Send to edge function for AI processing
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ pdfText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Aguarde alguns segundos e tente novamente.');
        }
        if (response.status === 402) {
          throw new Error('Créditos de IA insuficientes. Entre em contato com o administrador.');
        }
        throw new Error(errorData.error || 'Erro ao processar PDF com IA');
      }

      const extractedData: ExtractedData = await response.json();
      
      if (!extractedData.items || extractedData.items.length === 0) {
        throw new Error('Nenhum item encontrado no PDF. Verifique se o formato do documento é compatível.');
      }

      onDataExtracted(extractedData, tipoImportacao, localidade, mesReferencia, empreiteira, file.name);
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [localidade, mesReferencia, tipoImportacao, empreiteira]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <FileText className="h-4 w-4 md:h-5 md:w-5" />
          Importar PDF
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Faça upload de documentos EMBASA para extração automática com IA
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
        {/* Configuration Selects - Mobile first: single column, then grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="tipo" className="text-xs md:text-sm">Tipo de Importação</Label>
            <Select value={tipoImportacao} onValueChange={(v) => setTipoImportacao(v as TipoImportacao)}>
              <SelectTrigger id="tipo" className="h-10 md:h-9 text-sm md:text-xs">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="solicitacao" className="text-sm md:text-xs">Solicitação</SelectItem>
                <SelectItem value="liberacao" className="text-sm md:text-xs">Liberação</SelectItem>
                <SelectItem value="utilizacao" className="text-sm md:text-xs">Utilização</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="localidade" className="text-xs md:text-sm">Localidade</Label>
            <Select value={localidade} onValueChange={setLocalidade}>
              <SelectTrigger id="localidade" className="h-10 md:h-9 text-sm md:text-xs">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="Salvador" className="text-sm md:text-xs">Salvador</SelectItem>
                <SelectItem value="Feira de Santana" className="text-sm md:text-xs">Feira de Santana</SelectItem>
                <SelectItem value="Vitória da Conquista" className="text-sm md:text-xs">Vitória da Conquista</SelectItem>
                <SelectItem value="Camaçari" className="text-sm md:text-xs">Camaçari</SelectItem>
                <SelectItem value="Itabuna" className="text-sm md:text-xs">Itabuna</SelectItem>
                <SelectItem value="Lauro de Freitas" className="text-sm md:text-xs">Lauro de Freitas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="mes" className="text-xs md:text-sm">Mês de Referência</Label>
            <Select value={mesReferencia} onValueChange={setMesReferencia}>
              <SelectTrigger id="mes" className="h-10 md:h-9 text-sm md:text-xs">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {mesesOptions.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value} className="text-sm md:text-xs">
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="empreiteira" className="text-xs md:text-sm">Empreiteira</Label>
            <Select value={empreiteira} onValueChange={setEmpreiteira}>
              <SelectTrigger id="empreiteira" className="h-10 md:h-9 text-sm md:text-xs">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="Consórcio Nova Bolandeira II" className="text-sm md:text-xs">Consórcio Nova Bolandeira II</SelectItem>
                <SelectItem value="Outra Empreiteira" className="text-sm md:text-xs">Outra Empreiteira</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Zone - Larger touch target on mobile */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-colors cursor-pointer min-h-[140px] md:min-h-[160px] flex items-center justify-center",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 active:border-primary active:bg-primary/5",
            isProcessing && "pointer-events-none opacity-50"
          )}
          onClick={() => !isProcessing && document.getElementById('pdf-input')?.click()}
        >
          <input
            id="pdf-input"
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />
          
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-primary" />
              <div>
                <p className="text-xs md:text-sm font-medium">Processando...</p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Extraindo dados com IA
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <Upload className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
              <div>
                <p className="text-xs md:text-sm font-medium">
                  <span className="hidden sm:inline">Arraste o PDF aqui ou clique para selecionar</span>
                  <span className="sm:hidden">Toque para selecionar PDF</span>
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                  Aceita arquivos .pdf
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions - Hidden on mobile to save space */}
        <div className="hidden md:block text-xs text-muted-foreground space-y-1">
          <p>• O sistema usa IA para extrair automaticamente códigos SAP, descrições e quantidades</p>
          <p>• Você poderá revisar e editar os dados antes de confirmar a importação</p>
          <p>• Documentos com "Itens Não Aprovados" serão identificados separadamente</p>
        </div>
      </CardContent>
    </Card>
  );
};
