import { Layout } from '@/components/layout/Layout';
import { ReservasTable } from '@/components/dashboard/ReservasTable';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { usePaginatedReservas } from '@/hooks/usePaginatedReservas';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileSpreadsheet, FileText } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToExcel, exportToPDF, reservasColumns } from '@/lib/exportUtils';

const ReservasPage = () => {
  const [searchParams] = useSearchParams();
  const [filtroLocalidade, setFiltroLocalidade] = useState<string>(searchParams.get('localidade') || 'Todos');
  const [filtroMaterial, setFiltroMaterial] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroMes, setFiltroMes] = useState<string>(searchParams.get('mes') || 'Todos');

  const filters = useMemo(() => ({
    localidade: filtroLocalidade,
    material: filtroMaterial,
    status: filtroStatus,
    mes: filtroMes,
  }), [filtroLocalidade, filtroMaterial, filtroStatus, filtroMes]);

  const {
    data: reservasPaginadas,
    total,
    totalPages: totalPaginas,
    currentPage: paginaAtual,
    loading,
    setPage: setPaginaAtual,
  } = usePaginatedReservas({ pageSize: 20, filters, onlyLiberados: true });

  // Aplicar filtros da URL
  useEffect(() => {
    const loc = searchParams.get('localidade');
    const mes = searchParams.get('mes');
    if (loc) setFiltroLocalidade(loc);
    if (mes) setFiltroMes(mes);
  }, [searchParams]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    const exportData = reservasPaginadas.map(r => ({
      ...r,
      saldo: r.quantidade_liberada - r.quantidade_utilizada,
    }));

    const options = {
      filename: 'reservas',
      title: 'Relatório de Reservas de Materiais',
      filters: { Localidade: filtroLocalidade, Mês: filtroMes, Status: filtroStatus },
      data: exportData,
      columns: reservasColumns,
    };

    if (format === 'excel') {
      await exportToExcel(options);
    } else {
      await exportToPDF(options);
    }
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
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold text-foreground">Reservas de Materiais</h1>
            <p className="text-[11px] text-muted-foreground">
              Materiais liberados - Total: {total} reservas
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9 md:h-7 text-sm md:text-xs px-3 md:px-2.5 w-full sm:w-auto">
                <Download className="h-4 w-4 md:h-3.5 md:w-3.5" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2 text-sm md:text-xs">
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 text-sm md:text-xs">
                <FileText className="h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <FilterBar
          filtroLocalidade={filtroLocalidade as any}
          setFiltroLocalidade={setFiltroLocalidade}
          filtroMaterial={filtroMaterial}
          setFiltroMaterial={setFiltroMaterial}
          filtroStatus={filtroStatus}
          setFiltroStatus={setFiltroStatus}
          filtroMes={filtroMes}
          setFiltroMes={setFiltroMes}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-end">
            <span className="text-[11px] text-muted-foreground">
              Mostrando {total > 0 ? ((paginaAtual - 1) * 20) + 1 : 0}-{Math.min(paginaAtual * 20, total)} de {total}
            </span>
          </div>

          <ReservasTable reservas={reservasPaginadas.map(r => ({
            id: r.id,
            numeroReserva: r.numero_reserva,
            materialId: r.material_codigo,
            materialCodigo: r.material_codigo,
            materialNome: r.material_nome,
            quantidadeSolicitada: r.quantidade_solicitada,
            quantidadeReservada: r.quantidade_liberada,
            quantidadeLiberada: r.quantidade_liberada,
            quantidadeUtilizada: r.quantidade_utilizada,
            saldo: r.quantidade_liberada - r.quantidade_utilizada,
            localidade: r.localidade as 'Lauro' | 'Salvador',
            dataReserva: r.data_reserva || '',
            dataSolicitacao: r.data_solicitacao || '',
            dataLiberacao: r.data_liberacao,
            status: r.status as any,
            empreiteira: r.empreiteira,
            justificativa: r.justificativa || '',
          }))} />

          {totalPaginas > 1 && (
            <Pagination className="mt-3">
              <PaginationContent className="flex-wrap justify-center gap-1">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                    className={cn(
                      "h-9 md:h-8",
                      paginaAtual === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    )}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pageNum: number;
                  if (totalPaginas <= 5) {
                    pageNum = i + 1;
                  } else if (paginaAtual <= 3) {
                    pageNum = i + 1;
                  } else if (paginaAtual >= totalPaginas - 2) {
                    pageNum = totalPaginas - 4 + i;
                  } else {
                    pageNum = paginaAtual - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPaginaAtual(pageNum)}
                        isActive={paginaAtual === pageNum}
                        className="cursor-pointer h-9 w-9 md:h-8 md:w-8"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                    className={cn(
                      "h-9 md:h-8",
                      paginaAtual === totalPaginas ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReservasPage;