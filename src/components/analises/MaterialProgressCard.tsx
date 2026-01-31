import { Progress } from '@/components/ui/progress';

interface MaterialProgressCardProps {
  nome: string;
  codigo: string;
  liberado: number;
  utilizado: number;
  saldo: number;
  taxaUtilizacao: number;
}

export const MaterialProgressCard = ({
  nome,
  codigo,
  liberado,
  utilizado,
  saldo,
  taxaUtilizacao,
}: MaterialProgressCardProps) => {
  const getProgressColor = (taxa: number) => {
    if (taxa >= 80) return 'bg-chart-2';
    if (taxa >= 40) return 'bg-chart-4';
    return 'bg-chart-1';
  };

  return (
    <div className="p-3 bg-accent/30 rounded-lg border border-border hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm truncate" title={nome}>
            {nome}
          </p>
          <p className="text-xs text-muted-foreground">
            Código: {codigo || 'N/A'}
          </p>
        </div>
        <span className={`text-sm font-bold ${
          taxaUtilizacao >= 80 ? 'text-chart-2' : 
          taxaUtilizacao >= 40 ? 'text-chart-4' : 
          'text-chart-1'
        }`}>
          {taxaUtilizacao.toFixed(0)}%
        </span>
      </div>
      
      <div className="mb-2">
        <Progress 
          value={taxaUtilizacao} 
          className="h-2"
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Liberado: <span className="font-medium text-foreground">{liberado.toLocaleString('pt-BR')}</span></span>
        <span>Utilizado: <span className="font-medium text-foreground">{utilizado.toLocaleString('pt-BR')}</span></span>
        <span>Saldo: <span className="font-medium text-foreground">{saldo.toLocaleString('pt-BR')}</span></span>
      </div>
    </div>
  );
};
