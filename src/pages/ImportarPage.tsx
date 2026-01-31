import { Layout } from '@/components/layout/Layout';
import { FileUpload } from '@/components/import/FileUpload';
import { ManualEntryForm } from '@/components/forms/ManualEntryForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, PenLine, History, Loader2 } from 'lucide-react';
import { useReservas } from '@/hooks/useReservas';
import { useHistorico } from '@/hooks/useHistorico';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ImportarPage = () => {
  const { importarDados } = useReservas();
  const { historico, loading: loadingHistorico, fetchHistorico } = useHistorico();

  const handleFileProcessed = async (
    data: any[], 
    tipo: 'solicitacao' | 'liberacao' | 'utilizacao', 
    localidade: string, 
    mes: string,
    nomeArquivo: string,
    empreiteira: string
  ) => {
    const result = await importarDados(data, tipo, localidade, mes, nomeArquivo, empreiteira);
    if (result) {
      fetchHistorico();
    }
    return result;
  };

  const tipoLabel: Record<string, string> = {
    solicitacao: 'Solicitação',
    liberacao: 'Liberação',
    utilizacao: 'Utilização',
  };

  const mesLabel: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Importar Dados</h1>
          <p className="text-xs text-muted-foreground">
            Importe dados via arquivo ou registre manualmente
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-9">
            <TabsTrigger value="upload" className="gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5 text-xs">
              <PenLine className="h-3.5 w-3.5" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <FileUpload onFileProcessed={handleFileProcessed} />
          </TabsContent>

          <TabsContent value="manual">
            <ManualEntryForm />
          </TabsContent>

          <TabsContent value="historico">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <History className="h-4 w-4 text-primary" />
                  Histórico de Importações
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loadingHistorico ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : historico.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma importação realizada ainda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historico.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-accent/50 rounded-md border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-primary/10 rounded-md">
                            <Upload className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{item.nome_arquivo}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {tipoLabel[item.tipo_importacao]} • {item.localidade} • {mesLabel[item.mes_referencia]}/{item.ano_referencia} • {item.quantidade_registros} registros
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-medium ${
                            item.status === 'Sucesso' ? 'text-chart-1' : 'text-chart-4'
                          }`}>
                            {item.status}
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(item.imported_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ImportarPage;
