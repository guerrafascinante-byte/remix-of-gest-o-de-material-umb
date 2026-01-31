import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface EvolucaoData {
  mes: string;
  liberado: number;
  utilizado: number;
}

interface TopMaterialData {
  nome: string;
  quantidade: number;
}

interface LocalData {
  name: string;
  value: number;
  fill: string;
}

interface ChartsProps {
  evolucaoMensal: EvolucaoData[];
  topMateriaisUtilizados: TopMaterialData[];
  distribuicaoPorLocal: LocalData[];
}

const chartColors = {
  liberado: 'hsl(var(--primary))',
  utilizado: 'hsl(var(--chart-1))',
  divergencia: 'hsl(var(--primary))',
};

export const EvolucaoChart = ({ data, className }: { data: EvolucaoData[]; className?: string }) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className={`border shadow-xs flex flex-col ${className || ''}`}>
      <CardHeader className="pb-1.5 pt-2.5 px-3">
        <CardTitle className="text-xs font-medium text-foreground">Evolução Mensal</CardTitle>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Liberado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-1"></span>
            Utilizado
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-2.5 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={isMobile ? 160 : 200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: isMobile ? -20 : -10, bottom: 0 }}>
            <defs>
              <linearGradient id="liberadoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="utilizadoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="mes" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={isMobile ? 9 : 10}
              tickLine={false}
              axisLine={false}
              interval={isMobile ? 1 : 0}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={isMobile ? 9 : 10}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 30 : 40}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '4px',
                fontSize: '10px',
                padding: '4px 8px'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="liberado" 
              stroke={chartColors.liberado}
              strokeWidth={2}
              fill="url(#liberadoGradient)"
              name="Liberado"
            />
            <Area 
              type="monotone" 
              dataKey="utilizado" 
              stroke={chartColors.utilizado}
              strokeWidth={2}
              fill="url(#utilizadoGradient)"
              name="Utilizado"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Função para truncar nomes longos
const truncateName = (name: string, maxLength: number = 20): string => {
  if (!name) return '';
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
};

export const TopMateriaisChart = ({ data, className }: { data: TopMaterialData[]; className?: string }) => {
  const isMobile = useIsMobile();
  
  // Pegar top 5 e truncar nomes (mais curto em mobile)
  const chartData = data.slice(0, 5).map(item => ({
    ...item,
    nomeOriginal: item.nome,
    nome: truncateName(item.nome, isMobile ? 12 : 18),
  }));
  
  return (
    <Card className={`border shadow-xs flex flex-col ${className || ''}`}>
      <CardHeader className="pb-1.5 pt-2.5 px-3">
        <CardTitle className="text-xs font-medium text-foreground">Top 5 Materiais Mais Utilizados</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2.5 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={isMobile ? 160 : 200}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 15, left: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis 
              type="number" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={isMobile ? 9 : 10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              dataKey="nome" 
              type="category" 
              width={isMobile ? 70 : 100} 
              tick={{ fontSize: isMobile ? 8 : 9 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '4px',
                fontSize: '10px',
                padding: '4px 8px'
              }}
              formatter={(value: number, name: string, props: any) => [
                value.toLocaleString('pt-BR'),
                props.payload.nomeOriginal || 'Quantidade'
              ]}
            />
            <Bar 
              dataKey="quantidade" 
              fill="hsl(var(--primary))" 
              radius={[0, 4, 4, 0]}
              barSize={isMobile ? 18 : 24}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const DistribuicaoLocalChart = ({ data, className }: { data: LocalData[]; className?: string }) => {
  const isMobile = useIsMobile();
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-1))'];
  
  return (
    <Card className={`border shadow-xs flex flex-col ${className || ''}`}>
      <CardHeader className="pb-1.5 pt-2.5 px-3">
        <CardTitle className="text-xs font-medium text-foreground">Liberado vs Utilizado</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2.5 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-center flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%" minHeight={isMobile ? 140 : 180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={isMobile ? 50 : 65}
                innerRadius={isMobile ? 35 : 45}
                dataKey="value"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '4px',
                  fontSize: '10px',
                  padding: '4px 8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-1.5">
          {data.map((entry, index) => (
            <span key={entry.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></span>
              {entry.name}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const DivergenciaChart = ({ data }: { data: Array<{ materialNome: string; divergencia: number; percentualDivergencia: number }> }) => {
  const isMobile = useIsMobile();
  
  const chartData = data.slice(0, 5).map(item => ({
    nome: item.materialNome.length > (isMobile ? 8 : 12) ? item.materialNome.substring(0, isMobile ? 8 : 12) + '...' : item.materialNome,
    divergencia: item.divergencia,
  }));

  return (
    <Card className="border shadow-xs">
      <CardHeader className="pb-1.5 pt-2.5 px-3">
        <CardTitle className="text-xs font-medium text-foreground">Materiais com Maior Divergência</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2.5">
        <ResponsiveContainer width="100%" height={isMobile ? 160 : 180}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: isMobile ? -20 : -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="nome" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={isMobile ? 8 : 10}
              tickLine={false}
              axisLine={false}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? "end" : "middle"}
              height={isMobile ? 50 : 30}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={isMobile ? 9 : 10}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 30 : 40}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '4px',
                fontSize: '10px',
                padding: '4px 8px'
              }}
            />
            <Bar 
              dataKey="divergencia" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]} 
              name="Divergência"
              barSize={isMobile ? 25 : 40}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const Charts = ({ evolucaoMensal, topMateriaisUtilizados, distribuicaoPorLocal }: ChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
      <EvolucaoChart data={evolucaoMensal} />
      <TopMateriaisChart data={topMateriaisUtilizados} />
      <DistribuicaoLocalChart data={distribuicaoPorLocal} />
    </div>
  );
};
