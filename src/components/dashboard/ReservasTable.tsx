import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';

interface ReservaSimplificada {
  id: string;
  numeroReserva: string;
  materialCodigo: string;
  materialNome: string;
  quantidadeLiberada: number;
  quantidadeUtilizada: number;
  saldo: number;
  localidade: 'Lauro' | 'Salvador';
}

interface ReservasTableProps {
  reservas: ReservaSimplificada[];
}

export const ReservasTable = ({ reservas }: ReservasTableProps) => {
  const isMobile = useIsMobile();

  if (reservas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Nenhuma reserva encontrada</p>
      </div>
    );
  }

  // Mobile: Card layout
  if (isMobile) {
    return (
      <div className="space-y-2">
        {reservas.map((reserva) => {
          const temDivergencia = reserva.quantidadeUtilizada > reserva.quantidadeLiberada;
          
          return (
            <Card key={reserva.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-primary truncate">
                        {reserva.numeroReserva}
                      </p>
                      <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {reserva.materialCodigo}
                      </span>
                    </div>
                    <p className="text-xs text-foreground font-medium truncate">
                      {reserva.materialNome}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-secondary text-secondary text-[10px] h-5 flex-shrink-0">
                    {reserva.localidade}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/30 rounded p-1.5">
                    <p className="text-[10px] text-muted-foreground">Liberado</p>
                    <p className="text-xs font-semibold">{reserva.quantidadeLiberada.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-muted/30 rounded p-1.5">
                    <p className="text-[10px] text-muted-foreground">Utilizado</p>
                    <p className="text-xs font-semibold">{reserva.quantidadeUtilizada.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className={cn(
                    "rounded p-1.5",
                    reserva.saldo > 0 ? "bg-primary/10" : "bg-muted/30"
                  )}>
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      Saldo
                      {temDivergencia && <AlertTriangle className="h-2.5 w-2.5 text-destructive" />}
                    </p>
                    <p className={cn(
                      "text-xs font-semibold",
                      reserva.saldo > 0 ? "text-primary" : "text-muted-foreground"
                    )}>
                      {reserva.saldo.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop: Table layout
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-medium py-2 text-xs">Nº Reserva</TableHead>
              <TableHead className="font-medium py-2 text-xs">Código</TableHead>
              <TableHead className="font-medium py-2 text-xs">Material</TableHead>
              <TableHead className="font-medium py-2 text-xs text-center">Liberado</TableHead>
              <TableHead className="font-medium py-2 text-xs text-center">Utilizado</TableHead>
              <TableHead className="font-medium py-2 text-xs text-center">Saldo</TableHead>
              <TableHead className="font-medium py-2 text-xs">Local</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservas.map((reserva) => {
              const temDivergencia = reserva.quantidadeUtilizada > reserva.quantidadeLiberada;
              
              return (
                <TableRow key={reserva.id} className="hover:bg-muted/20">
                  <TableCell className="py-1.5 text-sm font-medium text-primary">{reserva.numeroReserva}</TableCell>
                  <TableCell className="py-1.5 font-mono text-sm text-muted-foreground">{reserva.materialCodigo}</TableCell>
                  <TableCell className="py-1.5">
                    <p className="text-sm font-medium text-foreground">{reserva.materialNome}</p>
                  </TableCell>
                  <TableCell className="py-1.5 text-sm text-center">{reserva.quantidadeLiberada.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="py-1.5 text-sm text-center">{reserva.quantidadeUtilizada.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="py-1.5 text-center">
                    <span className={cn(
                      "text-sm font-semibold",
                      reserva.saldo > 0 ? "text-chart-1" : "text-muted-foreground"
                    )}>
                      {reserva.saldo.toLocaleString('pt-BR')}
                    </span>
                    {temDivergencia && (
                      <AlertTriangle className="inline-block ml-1 h-3.5 w-3.5 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Badge variant="outline" className="border-secondary text-secondary text-xs h-5">
                      {reserva.localidade}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
