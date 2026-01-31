import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardWidgetProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const DashboardWidget = ({ 
  title, 
  icon, 
  children, 
  className,
  noPadding = false 
}: DashboardWidgetProps) => {
  return (
    <Card className={cn("border shadow-xs", className)}>
      <CardHeader className="pb-1.5 pt-2.5 px-3">
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(noPadding ? "p-0" : "px-3 pb-3")}>
        {children}
      </CardContent>
    </Card>
  );
};
