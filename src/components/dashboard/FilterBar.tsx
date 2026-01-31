import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocalidadeType } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';

interface FilterBarProps {
  filtroLocalidade: LocalidadeType;
  setFiltroLocalidade: (value: LocalidadeType) => void;
  filtroMaterial?: string;
  setFiltroMaterial?: (value: string) => void;
  filtroStatus?: string;
  setFiltroStatus?: (value: string) => void;
  filtroMes?: string;
  setFiltroMes?: (value: string) => void;
  filtroAno?: number;
  setFiltroAno?: (value: number) => void;
  showSearch?: boolean;
}

const mesesOptions = [
  { value: 'Todos', label: 'Todos os Meses' },
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

export const FilterBar = ({
  filtroLocalidade,
  setFiltroLocalidade,
  filtroMaterial = '',
  setFiltroMaterial,
  filtroStatus = 'Todos',
  setFiltroStatus,
  filtroMes = 'Todos',
  setFiltroMes,
  filtroAno = new Date().getFullYear(),
  setFiltroAno,
  showSearch = true,
}: FilterBarProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  const activeFiltersCount = [
    filtroLocalidade !== 'Todos',
    filtroMes !== 'Todos',
    filtroMaterial?.length > 0,
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar material..."
            className="pl-7 h-8 text-xs"
            value={filtroMaterial}
            onChange={(e) => setFiltroMaterial?.(e.target.value)}
          />
        </div>
      )}
      
      <Select value={filtroLocalidade} onValueChange={(v) => setFiltroLocalidade(v as LocalidadeType)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Localidade" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          <SelectItem value="Todos" className="text-xs">Todas Localidades</SelectItem>
          <SelectItem value="Lauro" className="text-xs">Lauro de Freitas</SelectItem>
          <SelectItem value="Salvador" className="text-xs">Salvador</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={filtroMes} onValueChange={setFiltroMes}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {mesesOptions.map(mes => (
            <SelectItem key={mes.value} value={mes.value} className="text-xs">
              {mes.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={String(filtroAno)} 
        onValueChange={(v) => setFiltroAno?.(Number(v))}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          <SelectItem value={String(new Date().getFullYear())} className="text-xs">
            {new Date().getFullYear()}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // Mobile: collapsible filters
  if (isMobile) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="bg-card rounded-md border border-border">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2.5 h-auto">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2.5 pb-2.5">
            <FilterContent />
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  // Desktop: always visible
  return (
    <div className="bg-card rounded-md border border-border p-1.5">
      <FilterContent />
    </div>
  );
};
