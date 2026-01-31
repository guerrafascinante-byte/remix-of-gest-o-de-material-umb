import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface MaterialData {
  nome: string;
  codigo: string;
  liberado: number;
  utilizado: number;
  taxaUtilizacao: number;
}

interface TopMateriaisVolumeChartProps {
  data: MaterialData[];
}

export const TopMateriaisVolumeChart = ({ data }: TopMateriaisVolumeChartProps) => {
  const top10 = data.slice(0, 10);
  
  const chartData = top10.map(m => ({
    nome: m.nome.length > 12 ? m.nome.substring(0, 12) + '...' : m.nome,
    nomeCompleto: m.nome,
    liberado: m.liberado,
    utilizado: m.utilizado,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top 10 por Volume Liberado</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top 10 por Volume Liberado</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="nome" 
              width={80}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              interval={0}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                value.toLocaleString('pt-BR'),
                name === 'liberado' ? 'Liberado' : 'Utilizado'
              ]}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return (payload[0].payload as any).nomeCompleto;
                }
                return label;
              }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="liberado" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill="hsl(var(--chart-3))" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
