import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building2, PlusCircle, Edit, Trash2, Mail, Loader2 } from 'lucide-react';
import { useEmpreiteiras, Empreiteira } from '@/hooks/useEmpreiteiras';
import { useReservas } from '@/hooks/useReservas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const EmpreiteirasPage = () => {
  const { empreiteiras, loading, atualizarEmpreiteira, excluirEmpreiteira } = useEmpreiteiras();
  const { reservas, historicoImportacoes } = useReservas();
  
  const [editando, setEditando] = useState(false);
  const [empreiteiraEditando, setEmpreiteiraEditando] = useState<Empreiteira | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    contato: '',
    ativo: true,
  });
  const [salvando, setSalvando] = useState(false);

  // Calcular métricas reais por empreiteira
  const getMetricasEmpreiteira = (nomeEmpreiteira: string) => {
    // Reservas ativas = uploads de liberação para esta empreiteira
    const totalReservas = historicoImportacoes.filter(
      (h: any) => h.empreiteira === nomeEmpreiteira && h.tipo_importacao === 'liberacao' && h.status === 'Sucesso'
    ).length;
    
    const reservasEmpreiteira = reservas.filter(r => r.empreiteira === nomeEmpreiteira);
    const materiaisUnicos = new Set(reservasEmpreiteira.map(r => r.material_nome)).size;
    return {
      totalReservas,
      materiaisUnicos,
    };
  };

  const handleEditar = (empreiteira: Empreiteira) => {
    setEmpreiteiraEditando(empreiteira);
    setFormData({
      nome: empreiteira.nome,
      cnpj: empreiteira.cnpj || '',
      contato: empreiteira.contato || '',
      ativo: empreiteira.ativo,
    });
    setEditando(true);
  };

  const handleSalvar = async () => {
    if (!empreiteiraEditando) return;
    
    setSalvando(true);
    const sucesso = await atualizarEmpreiteira(empreiteiraEditando.id, {
      nome: formData.nome,
      cnpj: formData.cnpj || null,
      contato: formData.contato || null,
      ativo: formData.ativo,
    });
    setSalvando(false);
    
    if (sucesso) {
      setEditando(false);
      setEmpreiteiraEditando(null);
    }
  };

  const handleExcluir = async (id: string) => {
    await excluirEmpreiteira(id);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Empreiteiras</h1>
            <p className="text-xs text-muted-foreground">
              Gerencie as empreiteiras parceiras
            </p>
          </div>
          <Button size="sm" className="gap-1.5">
            <PlusCircle className="h-3.5 w-3.5" />
            Nova Empreiteira
          </Button>
        </div>

        {empreiteiras.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma empreiteira cadastrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {empreiteiras.map((empreiteira) => {
              const metricas = getMetricasEmpreiteira(empreiteira.nome);
              
              return (
                <Card key={empreiteira.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{empreiteira.nome}</CardTitle>
                          {empreiteira.cnpj && (
                            <p className="text-xs text-muted-foreground">CNPJ: {empreiteira.cnpj}</p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={empreiteira.ativo 
                          ? "bg-chart-1/10 text-chart-1 border-chart-1/20" 
                          : "bg-muted text-muted-foreground"
                        }
                      >
                        {empreiteira.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {empreiteira.contato && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {empreiteira.contato}
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Reservas ativas:</span>
                          <span className="font-semibold text-foreground">{metricas.totalReservas}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-0.5">
                          <span className="text-muted-foreground">Materiais em uso:</span>
                          <span className="font-semibold text-foreground">{metricas.materiaisUnicos}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3">
                        <Button 
                          variant="outline" 
                          size="xs" 
                          className="flex-1 gap-1"
                          onClick={() => handleEditar(empreiteira)}
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="xs" 
                              className="flex-1 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Empreiteira?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir "{empreiteira.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleExcluir(empreiteira.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal de Edição */}
        <Dialog open={editando} onOpenChange={setEditando}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Empreiteira</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da empreiteira"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contato">Contato (Email)</Label>
                <Input
                  id="contato"
                  value={formData.contato}
                  onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ativo">Empreiteira Ativa</Label>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvar} disabled={salvando || !formData.nome}>
                {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default EmpreiteirasPage;
