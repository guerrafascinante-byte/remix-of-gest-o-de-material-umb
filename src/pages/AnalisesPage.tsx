import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReservas } from '@/hooks/useReservas';
import { MaterialProgressCard } from '@/components/analises/MaterialProgressCard';
import { DistribuicaoEficienciaChart } from '@/components/analises/DistribuicaoEficienciaChart';
import { TopMateriaisVolumeChart } from '@/components/analises/TopMateriaisVolumeChart';
import { TrendingUp, Package, Calculator, CheckCircle, Search } from 'lucide-react';

const AnalisesPage = () => {
  const [buscaMaterial, setBuscaMaterial] = useState('');
  
  const {
    visaoGeralPorMaterial,
    metricasAnalise,
    distribuicaoEficiencia,
    filtroMes,
    setFiltroMes,
  } = useReservas();

  const materiaisFiltrados = visaoGeralPorMaterial.filter(m => 
    m.nome.toLowerCase().includes(buscaMaterial.toLowerCase()) ||
    m.codigo.includes(buscaMaterial)
  );

  return (
    <Layout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Análises e Indicadores</h1>
            <p className="text-xs text-muted-foreground">
              Visão detalhada por material com métricas de utilização
            </p>
          </div>
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os meses</SelectItem>
              <SelectItem value="01">Janeiro</SelectItem>
              <SelectItem value="02">Fevereiro</SelectItem>
              <SelectItem value="03">Março</SelectItem>
              <SelectItem value="04">Abril</SelectItem>
              <SelectItem value="05">Maio</SelectItem>
              <SelectItem value="06">Junho</SelectItem>
              <SelectItem value="07">Julho</SelectItem>
              <SelectItem value="08">Agosto</SelectItem>
              <SelectItem value="09">Setembro</SelectItem>
              <SelectItem value="10">Outubro</SelectItem>
              <SelectItem value="11">Novembro</SelectItem>
              <SelectItem value="12">Dezembro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards - 4 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Taxa de Utilização</p>
                  <p className="text-lg font-bold text-foreground">
                    {metricasAnalise.taxaUtilizacao.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-chart-3/10 rounded-md">
                  <Package className="h-3.5 w-3.5 text-chart-3" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Materiais Únicos</p>
                  <p className="text-lg font-bold text-foreground">
                    {metricasAnalise.materiaisUnicos}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-chart-4/10 rounded-md">
                  <Calculator className="h-3.5 w-3.5 text-chart-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Média/Material</p>
                  <p className="text-lg font-bold text-foreground">
                    {metricasAnalise.mediaPorMaterial.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-chart-2/10 rounded-md">
                  <CheckCircle className="h-3.5 w-3.5 text-chart-2" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Alta Eficiência</p>
                  <p className="text-lg font-bold text-foreground">
                    {metricasAnalise.altaEficiencia}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Material Overview */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Visão Geral por Material
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {materiaisFiltrados.length} materiais encontrados
                </CardDescription>
              </div>
              <div className="relative w-52">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar material..."
                  value={buscaMaterial}
                  onChange={(e) => setBuscaMaterial(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto">
              {materiaisFiltrados.length === 0 ? (
                <div className="col-span-full text-center py-6 text-muted-foreground text-xs">
                  Nenhum material encontrado
                </div>
              ) : (
                materiaisFiltrados.map((material, index) => (
                  <MaterialProgressCard
                    key={`${material.codigo}-${index}`}
                    nome={material.nome}
                    codigo={material.codigo}
                    liberado={material.liberado}
                    utilizado={material.utilizado}
                    saldo={material.saldo}
                    taxaUtilizacao={material.taxaUtilizacao}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <DistribuicaoEficienciaChart data={distribuicaoEficiencia} />
          <TopMateriaisVolumeChart data={visaoGeralPorMaterial} />
        </div>
      </div>
    </Layout>
  );
};

export default AnalisesPage;
