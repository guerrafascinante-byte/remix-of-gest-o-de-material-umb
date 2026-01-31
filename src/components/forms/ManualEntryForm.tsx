import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReservas } from '@/hooks/useReservas';

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

export const ManualEntryForm = () => {
  const [formData, setFormData] = useState({
    numeroReserva: '',
    materialCodigo: '',
    materialNome: '',
    quantidadeLiberada: '',
    quantidadeUtilizada: '',
    localidade: 'Salvador',
    mesReferencia: '01',
    justificativa: '',
    dataReserva: '',
  });
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  const { adicionarReserva } = useReservas();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numeroReserva || !formData.materialCodigo || !formData.materialNome) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o número da reserva, código e nome do material.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    
    const reservaData = {
      numero_reserva: formData.numeroReserva.trim(),
      material_codigo: formData.materialCodigo.trim(),
      material_nome: formData.materialNome.trim().toUpperCase(),
      localidade: formData.localidade as 'Salvador' | 'Lauro',
      mes_referencia: formData.mesReferencia,
      ano_referencia: 2025,
      quantidade_liberada: Number(formData.quantidadeLiberada) || 0,
      quantidade_utilizada: Number(formData.quantidadeUtilizada) || 0,
      saldo: (Number(formData.quantidadeLiberada) || 0) - (Number(formData.quantidadeUtilizada) || 0),
      justificativa: formData.justificativa.trim() || null,
      data_reserva: formData.dataReserva || null,
    };

    const success = await adicionarReserva(reservaData);
    setSaving(false);
    
    if (success) {
      toast({
        title: 'Registro salvo',
        description: `Reserva ${formData.numeroReserva} registrada com sucesso.`,
      });

      setFormData({
        numeroReserva: '',
        materialCodigo: '',
        materialNome: '',
        quantidadeLiberada: '',
        quantidadeUtilizada: '',
        localidade: 'Salvador',
        mesReferencia: '01',
        justificativa: '',
        dataReserva: '',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-primary" />
          Registro Manual de Material
        </CardTitle>
        <CardDescription>
          Adicione manualmente informações de liberações e utilizações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroReserva">Número da Reserva *</Label>
              <Input
                id="numeroReserva"
                placeholder="Ex: RES-2024-001"
                value={formData.numeroReserva}
                onChange={(e) => handleChange('numeroReserva', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="materialCodigo">Código do Material *</Label>
              <Input
                id="materialCodigo"
                placeholder="Ex: 300000001378"
                value={formData.materialCodigo}
                onChange={(e) => handleChange('materialCodigo', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="materialNome">Nome do Material *</Label>
              <Input
                id="materialNome"
                placeholder="Ex: TUBO PVC 100MM"
                value={formData.materialNome}
                onChange={(e) => handleChange('materialNome', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="localidade">Localidade *</Label>
              <Select 
                value={formData.localidade} 
                onValueChange={(v) => handleChange('localidade', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Salvador">Salvador</SelectItem>
                  <SelectItem value="Lauro">Lauro de Freitas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mesReferencia">Mês de Referência *</Label>
              <Select 
                value={formData.mesReferencia} 
                onValueChange={(v) => handleChange('mesReferencia', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mesesOptions.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataReserva">Data Reserva</Label>
              <Input
                id="dataReserva"
                type="date"
                value={formData.dataReserva}
                onChange={(e) => handleChange('dataReserva', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidadeLiberada">Qtd. Liberada *</Label>
              <Input
                id="quantidadeLiberada"
                type="number"
                placeholder="0"
                value={formData.quantidadeLiberada}
                onChange={(e) => handleChange('quantidadeLiberada', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantidadeUtilizada">Qtd. Utilizada</Label>
              <Input
                id="quantidadeUtilizada"
                type="number"
                placeholder="0"
                value={formData.quantidadeUtilizada}
                onChange={(e) => handleChange('quantidadeUtilizada', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa da Empreiteira</Label>
            <Textarea
              id="justificativa"
              placeholder="Informe a justificativa para divergências ou observações..."
              value={formData.justificativa}
              onChange={(e) => handleChange('justificativa', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Registro
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
