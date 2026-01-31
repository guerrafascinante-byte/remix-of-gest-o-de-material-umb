import { Layout } from '@/components/layout/Layout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { EvolucaoChart, TopMateriaisChart, DistribuicaoLocalChart } from '@/components/dashboard/Charts';
import { useReservas } from '@/hooks/useReservas';
import { 
  FileCheck, 
  Truck, 
  Boxes,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const Index = () => {
  const {
    loading,
    metricas,
    filtroLocalidade,
    setFiltroLocalidade,
    filtroMes,
    setFiltroMes,
    filtroAno,
    setFiltroAno,
    topMateriaisUtilizados,
    evolucaoMensal,
    distribuicaoLiberadoUtilizado,
  } = useReservas();

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
      <div className="flex flex-col space-y-3 md:space-y-4 min-h-[calc(100vh-140px)]">
        {/* Page Header */}
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-[11px] md:text-xs text-muted-foreground">
            <span className="hidden sm:inline">Visão geral do controle de materiais - EMBASA x Consórcio Nova Bolandeira II</span>
            <span className="sm:hidden">Visão geral do controle de materiais</span>
          </p>
        </div>

        {/* Metric Cards - 2 cols on mobile, scales up on larger */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
          <MetricCard
            title="Total de Reservas"
            value={metricas.totalReservas}
            icon={<FileCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            variant="primary"
          />
          <MetricCard
            title="Qtd. Liberada (Unid.)"
            value={metricas.totalLiberado}
            icon={<Truck className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            variant="success"
          />
          <MetricCard
            title="Qtd. Utilizada (Unid.)"
            value={metricas.totalUtilizado}
            variant="default"
          />
          <MetricCard
            title="Saldo Estoque"
            value={metricas.saldoEstoque}
            icon={<Boxes className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            variant="warning"
          />
          <MetricCard
            title="Divergência"
            value={metricas.divergenciaTotal}
            icon={<AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            variant="danger"
          />
        </div>

        {/* Filters */}
        <FilterBar
          filtroLocalidade={filtroLocalidade as any}
          setFiltroLocalidade={setFiltroLocalidade}
          filtroMes={filtroMes}
          setFiltroMes={setFiltroMes}
          filtroAno={filtroAno}
          setFiltroAno={setFiltroAno}
          showSearch={false}
        />

        {/* Charts Grid - stack on mobile, grid on larger - expands to fill remaining space */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 flex-1">
          <EvolucaoChart data={evolucaoMensal} className="h-full min-h-[280px]" />
          <TopMateriaisChart data={topMateriaisUtilizados} className="h-full min-h-[280px]" />
          <DistribuicaoLocalChart data={distribuicaoLiberadoUtilizado} className="h-full min-h-[280px]" />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
