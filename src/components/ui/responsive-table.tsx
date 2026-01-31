import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResponsiveTableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  mobileVisible?: boolean; // Show in mobile card view
  mobilePriority?: number; // Order in mobile view (lower = first)
  className?: string;
}

interface ResponsiveTableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  actions?: ResponsiveTableAction<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

function getValue<T>(item: T, key: keyof T | string): any {
  if (typeof key === 'string' && key.includes('.')) {
    return key.split('.').reduce((obj: any, k) => obj?.[k], item);
  }
  return item[key as keyof T];
}

export function ResponsiveTable<T>({
  data,
  columns,
  actions,
  keyExtractor,
  emptyMessage = "Nenhum item encontrado",
  emptyIcon,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile: Card layout
  if (isMobile) {
    const mobileColumns = columns
      .filter(col => col.mobileVisible !== false)
      .sort((a, b) => (a.mobilePriority || 99) - (b.mobilePriority || 99));

    return (
      <div className="space-y-3">
        {data.map((item) => (
          <Card key={keyExtractor(item)} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-2">
                  {mobileColumns.map((col, idx) => (
                    <div key={String(col.key)} className={cn(
                      idx === 0 ? "text-sm font-medium text-foreground" : "text-xs text-muted-foreground",
                      col.className
                    )}>
                      {col.render ? col.render(item) : (
                        <span>
                          {idx > 0 && <span className="font-medium mr-1">{col.header}:</span>}
                          {String(getValue(item, col.key) ?? '')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                
                {actions && actions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      {actions.map((action, actionIdx) => (
                        <DropdownMenuItem
                          key={actionIdx}
                          onClick={() => action.onClick(item)}
                          className={cn(
                            "gap-2",
                            action.variant === "destructive" && "text-destructive focus:text-destructive"
                          )}
                        >
                          {action.icon}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop: Table layout
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "font-medium py-2 px-3 text-xs text-left text-muted-foreground",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="font-medium py-2 px-3 text-xs text-center text-muted-foreground w-16">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-muted/20 border-b border-border last:border-0">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn("py-1.5 px-3 text-sm", col.className)}
                  >
                    {col.render ? col.render(item) : String(getValue(item, col.key) ?? '')}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="py-1.5 px-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        {actions.map((action, actionIdx) => (
                          <DropdownMenuItem
                            key={actionIdx}
                            onClick={() => action.onClick(item)}
                            className={cn(
                              "gap-2 text-xs",
                              action.variant === "destructive" && "text-destructive focus:text-destructive"
                            )}
                          >
                            {action.icon}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
