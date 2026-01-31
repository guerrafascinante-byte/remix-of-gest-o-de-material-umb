import { useState, useCallback } from 'react';
import { Upload, FileText, File, X, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useEmpreiteiras } from '@/hooks/useEmpreiteiras';
import { ImportPreview } from './ImportPreview';
import ExcelJS from 'exceljs';

type TipoImportacao = 'solicitacao' | 'liberacao' | 'utilizacao';

interface FileUploadProps {
  onFileProcessed?: (data: any[], tipo: TipoImportacao, localidade: string, mes: string, nomeArquivo: string, empreiteira: string) => Promise<boolean>;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
  data?: any[];
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

export const FileUpload = ({ onFileProcessed }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [tipoImportacao, setTipoImportacao] = useState<TipoImportacao>('liberacao');
  const [localidade, setLocalidade] = useState<'Lauro' | 'Salvador'>('Salvador');
  const [mesReferencia, setMesReferencia] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [empreiteiraSelecionada, setEmpreiteiraSelecionada] = useState<string>('Consórcio Nova Bolandeira II');
  const [enviando, setEnviando] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ data: any[]; fileName: string } | null>(null);
  const { toast } = useToast();
  const { empreiteiras } = useEmpreiteiras();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processExcelFile = useCallback(async (file: File): Promise<{ success: boolean; message: string; data?: any[] }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return { success: false, message: 'Arquivo vazio ou sem planilhas.' };
      }

      const jsonData: Record<string, any>[] = [];
      const headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell) => headers.push(String(cell.value || '')));
        } else {
          const rowData: Record<string, any> = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          if (Object.keys(rowData).length > 0) {
            jsonData.push(rowData);
          }
        }
      });

      if (jsonData.length === 0) {
        return { success: false, message: 'Arquivo vazio ou sem dados válidos.' };
      }

      return { 
        success: true, 
        message: `${jsonData.length} registros encontrados`,
        data: jsonData 
      };
    } catch (error) {
      console.error('Erro ao processar Excel:', error);
      return { success: false, message: 'Erro ao processar arquivo Excel.' };
    }
  }, []);

  const processCSVFile = useCallback(async (file: File): Promise<{ success: boolean; message: string; data?: any[] }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            resolve({ success: false, message: 'Arquivo CSV vazio.' });
            return;
          }
          const headers = lines[0].split(';').map(h => h.trim());
          const data = lines.slice(1).map(line => {
            const values = line.split(';');
            const obj: Record<string, string> = {};
            headers.forEach((header, i) => {
              obj[header] = values[i]?.trim() || '';
            });
            return obj;
          });
          resolve({ success: true, message: `${data.length} registros encontrados`, data });
        } catch (error) {
          resolve({ success: false, message: 'Erro ao processar CSV.' });
        }
      };
      reader.onerror = () => resolve({ success: false, message: 'Erro ao ler arquivo.' });
      reader.readAsText(file);
    });
  }, []);

  const processFile = useCallback(async (file: File): Promise<{ success: boolean; message: string; data?: any[] }> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['xlsx', 'csv'].includes(extension || '')) {
      return { success: false, message: 'Formato não suportado. Use Excel (.xlsx) ou CSV.' };
    }

    if (extension === 'csv') {
      return processCSVFile(file);
    } else {
      return processExcelFile(file);
    }
  }, [processCSVFile, processExcelFile]);

  const handleFiles = useCallback(async (files: FileList) => {
    const newFiles = Array.from(files).map(file => ({
      file,
      status: 'pending' as const,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    for (let i = 0; i < newFiles.length; i++) {
      setUploadedFiles(prev => 
        prev.map((f, idx) => 
          idx === prev.length - newFiles.length + i 
            ? { ...f, status: 'processing' as const }
            : f
        )
      );

      const result = await processFile(newFiles[i].file);

      setUploadedFiles(prev =>
        prev.map((f, idx) =>
          idx === prev.length - newFiles.length + i
            ? { 
                ...f, 
                status: result.success ? 'success' as const : 'error' as const,
                message: result.message,
                data: result.data
              }
            : f
        )
      );
    }
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Mostrar preview antes de enviar
  const handleShowPreview = useCallback(() => {
    const successFiles = uploadedFiles.filter(f => f.status === 'success' && f.data);
    
    if (successFiles.length === 0) {
      toast({
        title: 'Nenhum arquivo válido',
        description: 'Adicione arquivos válidos antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    // Combinar dados de todos os arquivos para preview
    const allData = successFiles.flatMap(f => f.data || []);
    const fileName = successFiles.length === 1 
      ? successFiles[0].file.name 
      : `${successFiles.length} arquivos`;

    setPreviewData({ data: allData, fileName });
    setShowPreview(true);
  }, [uploadedFiles, toast]);

  // Confirmar importação após preview
  const handleConfirmImport = useCallback(async () => {
    const successFiles = uploadedFiles.filter(f => f.status === 'success' && f.data);
    
    setEnviando(true);

    try {
      for (const fileData of successFiles) {
        if (onFileProcessed && fileData.data) {
          await onFileProcessed(fileData.data, tipoImportacao, localidade, mesReferencia, fileData.file.name, empreiteiraSelecionada);
        }
      }
      setUploadedFiles([]);
      setShowPreview(false);
      setPreviewData(null);
    } finally {
      setEnviando(false);
    }
  }, [uploadedFiles, tipoImportacao, localidade, mesReferencia, empreiteiraSelecionada, onFileProcessed]);

  const handleCancelPreview = useCallback(() => {
    setShowPreview(false);
    setPreviewData(null);
  }, []);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-4 w-4 text-destructive" />;
    return <File className="h-4 w-4 text-primary" />;
  };

  const hasValidFiles = uploadedFiles.some(f => f.status === 'success');

  // Mostrar preview se ativo
  if (showPreview && previewData) {
    return (
      <ImportPreview
        data={previewData.data}
        fileName={previewData.fileName}
        tipoImportacao={tipoImportacao}
        localidade={localidade}
        mesReferencia={mesReferencia}
        empreiteira={empreiteiraSelecionada}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelPreview}
        isLoading={enviando}
      />
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Upload className="h-4 w-4 text-primary" />
          Importar Arquivos
        </CardTitle>
        <CardDescription className="text-xs">
          Faça upload de arquivos Excel ou CSV com os dados de materiais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de Importação</Label>
            <Select value={tipoImportacao} onValueChange={(v) => setTipoImportacao(v as TipoImportacao)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solicitacao" className="text-xs">Materiais Solicitados (Empreiteira)</SelectItem>
                <SelectItem value="liberacao" className="text-xs">Materiais Liberados (EMBASA)</SelectItem>
                <SelectItem value="utilizacao" className="text-xs">Materiais Utilizados (Empreiteira)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Localidade</Label>
            <Select value={localidade} onValueChange={(v) => setLocalidade(v as 'Lauro' | 'Salvador')}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Salvador" className="text-xs">Salvador</SelectItem>
                <SelectItem value="Lauro" className="text-xs">Lauro de Freitas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Mês de Referência</Label>
            <Select value={mesReferencia} onValueChange={setMesReferencia}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mesesOptions.map(mes => (
                  <SelectItem key={mes.value} value={mes.value} className="text-xs">
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Empreiteira</Label>
            <Select value={empreiteiraSelecionada} onValueChange={setEmpreiteiraSelecionada}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {empreiteiras.filter(e => e.ativo).map(e => (
                  <SelectItem key={e.id} value={e.nome} className="text-xs">
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-accent/30"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept=".xlsx,.csv"
            className="hidden"
            onChange={handleFileInput}
          />
          
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Suporta Excel (.xlsx) e CSV
              </p>
            </div>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-foreground">Arquivos Carregados</h4>
            <div className="space-y-1.5">
              {uploadedFiles.map((item, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-md border text-xs",
                    item.status === 'success' && "bg-chart-1/10 border-chart-1/30",
                    item.status === 'error' && "bg-destructive/10 border-destructive/30",
                    item.status === 'processing' && "bg-chart-4/10 border-chart-4/30",
                    item.status === 'pending' && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {getFileIcon(item.file.name)}
                    <div>
                      <p className="font-medium text-foreground">{item.file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(item.file.size / 1024).toFixed(1)} KB
                        {item.message && ` • ${item.message}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {item.status === 'processing' && (
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-chart-1" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasValidFiles && (
          <Button 
            onClick={handleShowPreview} 
            className="w-full gap-2"
            size="sm"
          >
            <Send className="h-4 w-4" />
            Visualizar e Confirmar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
