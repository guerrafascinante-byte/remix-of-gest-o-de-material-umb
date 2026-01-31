import { useState, useCallback, useEffect } from 'react';

export type WidgetType = 
  | 'metricas'
  | 'evolucao'
  | 'topMateriais'
  | 'distribuicaoLocal'
  | 'ultimasImportacoes'
  | 'divergenciasAtivas';

export interface WidgetConfig {
  id: WidgetType;
  title: string;
  visible: boolean;
  order: number;
}

const defaultWidgets: WidgetConfig[] = [
  { id: 'metricas', title: 'Métricas (KPIs)', visible: true, order: 0 },
  { id: 'evolucao', title: 'Evolução Mensal', visible: true, order: 1 },
  { id: 'topMateriais', title: 'Top Materiais', visible: true, order: 2 },
  { id: 'distribuicaoLocal', title: 'Distribuição por Local', visible: true, order: 3 },
  { id: 'ultimasImportacoes', title: 'Últimas Importações', visible: true, order: 4 },
  { id: 'divergenciasAtivas', title: 'Divergências Ativas', visible: true, order: 5 },
];

const STORAGE_KEY = 'sgm-dashboard-config';

export const useDashboardConfig = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge com defaults para garantir novos widgets
        return defaultWidgets.map(defaultWidget => {
          const savedWidget = parsed.find((w: WidgetConfig) => w.id === defaultWidget.id);
          return savedWidget || defaultWidget;
        });
      }
    } catch (e) {
      console.error('Erro ao carregar config do dashboard:', e);
    }
    return defaultWidgets;
  });

  const [isEditing, setIsEditing] = useState(false);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (e) {
      console.error('Erro ao salvar config do dashboard:', e);
    }
  }, [widgets]);

  const toggleWidget = useCallback((widgetId: WidgetType) => {
    setWidgets(prev => 
      prev.map(w => 
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
    );
  }, []);

  const moveWidget = useCallback((widgetId: WidgetType, direction: 'up' | 'down') => {
    setWidgets(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(w => w.id === widgetId);
      
      if (direction === 'up' && index > 0) {
        const temp = sorted[index].order;
        sorted[index].order = sorted[index - 1].order;
        sorted[index - 1].order = temp;
      } else if (direction === 'down' && index < sorted.length - 1) {
        const temp = sorted[index].order;
        sorted[index].order = sorted[index + 1].order;
        sorted[index + 1].order = temp;
      }
      
      return sorted;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setWidgets(defaultWidgets);
  }, []);

  const visibleWidgets = widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  const allWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return {
    widgets: visibleWidgets,
    allWidgets,
    isEditing,
    setIsEditing,
    toggleWidget,
    moveWidget,
    resetToDefault,
  };
};
