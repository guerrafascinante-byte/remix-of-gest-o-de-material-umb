import { Settings, Eye, EyeOff, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { WidgetConfig, WidgetType } from '@/hooks/useDashboardConfig';
import { cn } from '@/lib/utils';

interface WidgetSettingsProps {
  widgets: WidgetConfig[];
  onToggle: (widgetId: WidgetType) => void;
  onMove: (widgetId: WidgetType, direction: 'up' | 'down') => void;
  onReset: () => void;
}

export const WidgetSettings = ({ widgets, onToggle, onMove, onReset }: WidgetSettingsProps) => {
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
          <Settings className="h-3.5 w-3.5" />
          Personalizar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Personalizar Dashboard</DialogTitle>
          <DialogDescription className="text-xs">
            Escolha quais widgets exibir e reordene conforme sua preferência.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {sortedWidgets.map((widget, index) => (
            <div
              key={widget.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                widget.visible 
                  ? "bg-accent/50 border-border" 
                  : "bg-muted/30 border-dashed"
              )}
            >
              <div className="flex items-center gap-3">
                <Switch
                  id={widget.id}
                  checked={widget.visible}
                  onCheckedChange={() => onToggle(widget.id)}
                />
                <Label
                  htmlFor={widget.id}
                  className={cn(
                    "text-sm cursor-pointer",
                    !widget.visible && "text-muted-foreground"
                  )}
                >
                  {widget.title}
                </Label>
              </div>

              <div className="flex items-center gap-1">
                {widget.visible ? (
                  <Eye className="h-3.5 w-3.5 text-chart-1 mr-2" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onMove(widget.id, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onMove(widget.id, 'down')}
                  disabled={index === sortedWidgets.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
