import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { PDFUpload } from '@/components/import/PDFUpload';
import { PDFDataPreview } from '@/components/import/PDFDataPreview';
import { useReservas } from '@/hooks/useReservas';
import { useToast } from '@/hooks/use-toast';

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

type TipoImportacao = 'solicitacao' | 'liberacao' | 'utilizacao';

interface PreviewData {
  extractedData: ExtractedData;
  tipoImportacao: TipoImportacao;
  localidade: string;
  mesReferencia: string;
  empreiteira: string;
  fileName: string;
}

const ImportarPDFPage = () => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { importarDados } = useReservas();
  const { toast } = useToast();

  const handleDataExtracted = (
    extractedData: ExtractedData,
    tipoImportacao: TipoImportacao,
    localidade: string,
    mesReferencia: string,
    empreiteira: string,
    fileName: string
  ) => {
    setPreviewData({
      extractedData,
      tipoImportacao,
      localidade,
      mesReferencia,
      empreiteira,
      fileName,
    });
  };

  const handleConfirmImport = async (selectedItems: ExtractedItem[]) => {
    if (!previewData) return;

    setIsImporting(true);

    try {
      // Transform items to the format expected by importarDados
      const dadosParaImportar = selectedItems.map((item) => ({
        codigo_sap: item.codigo,
        nome_material: item.descricao,
        unidade: item.unidade || 'UN',
        quantidade: item.quantidade_fornecida,
        // Additional fields from metadata
        numero_reserva: previewData.extractedData.metadata?.numero_reserva || '',
      }));

      const success = await importarDados(
        dadosParaImportar,
        previewData.tipoImportacao,
        previewData.localidade,
        previewData.mesReferencia,
        previewData.fileName,
        previewData.empreiteira
      );

      if (success) {
        toast({
          title: 'Importação concluída',
          description: `${selectedItems.length} itens importados com sucesso do PDF.`,
        });
        setPreviewData(null);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao importar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">Importar PDF</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Extraia dados de documentos EMBASA usando IA
          </p>
        </div>

        {previewData ? (
          <PDFDataPreview
            data={previewData.extractedData}
            tipoImportacao={previewData.tipoImportacao}
            localidade={previewData.localidade}
            mesReferencia={previewData.mesReferencia}
            empreiteira={previewData.empreiteira}
            fileName={previewData.fileName}
            onConfirm={handleConfirmImport}
            onCancel={handleCancel}
            isLoading={isImporting}
          />
        ) : (
          <PDFUpload onDataExtracted={handleDataExtracted} />
        )}
      </div>
    </Layout>
  );
};

export default ImportarPDFPage;
