import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary/10 border-primary/20',
  success: 'bg-chart-1/10 border-chart-1/20',
  warning: 'bg-chart-4/10 border-chart-4/20',
  danger: 'bg-destructive/10 border-destructive/20',
};

const iconVariantStyles = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-chart-1 text-primary-foreground',
  warning: 'bg-chart-4 text-primary-foreground',
  danger: 'bg-destructive text-destructive-foreground',
};

export const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  variant = 'default' 
}: MetricCardProps) => {
  return (
    <Card className={cn("border shadow-xs", variantStyles[variant])}>
      <CardContent className="p-2.5 md:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[10px] md:text-xs font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-base md:text-lg font-bold text-foreground">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
            {trend && (
              <p className={cn(
                "text-[10px] md:text-xs font-medium",
                trend.isPositive ? "text-chart-1" : "text-destructive"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "p-1.5 rounded-md flex-shrink-0",
              iconVariantStyles[variant]
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
