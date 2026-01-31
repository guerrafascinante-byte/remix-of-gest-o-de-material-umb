import { useState, useEffect } from 'react';
import { History, User, FileEdit, Plus, Trash, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuditLog, AuditLogEntry, AuditAction } from '@/hooks/useAuditLog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AuditLogViewerProps {
  tableName?: string;
  recordId?: string;
  limit?: number;
  compact?: boolean;
}

const actionConfig: Record<AuditAction, { icon: React.ComponentType<any>; color: string; label: string }> = {
  CREATE: { icon: Plus, color: 'bg-chart-1/10 text-chart-1', label: 'Criação' },
  UPDATE: { icon: FileEdit, color: 'bg-chart-4/10 text-chart-4', label: 'Atualização' },
  DELETE: { icon: Trash, color: 'bg-destructive/10 text-destructive', label: 'Exclusão' },
  IMPORT: { icon: Upload, color: 'bg-primary/10 text-primary', label: 'Importação' },
};

export const AuditLogViewer = ({ tableName, recordId, limit = 50, compact = false }: AuditLogViewerProps) => {
  const { fetchLogs } = useAuditLog();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      const data = await fetchLogs(tableName, recordId, limit);
      setLogs(data);
      setLoading(false);
    };
    loadLogs();
  }, [fetchLogs, tableName, recordId, limit]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <History className="h-8 w-8 mb-2" />
          <p className="text-sm">Nenhum histórico de alterações encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      {!compact && (
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <History className="h-4 w-4 text-primary" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn("px-4 pb-4", compact && "pt-4")}>
        <ScrollArea className={compact ? "h-[200px]" : "h-[400px]"}>
          <div className="space-y-2">
            {logs.map((log) => {
              const config = actionConfig[log.action as AuditAction] || actionConfig.UPDATE;
              const Icon = config.icon;
              const isExpanded = expandedId === log.id;
              const hasDetails = log.old_values || log.new_values;

              return (
                <div
                  key={log.id}
                  className="p-3 bg-accent/30 rounded-lg border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-md", config.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {log.table_name}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground mt-1">
                        {log.description || `${config.label} em ${log.table_name}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <User className="h-3 w-3" />
                          {log.user_name}
                        </div>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    {hasDetails && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleExpand(log.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>

                  {isExpanded && hasDetails && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {log.old_values && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">Valores Anteriores:</p>
                          <pre className="text-[10px] bg-background p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">Novos Valores:</p>
                          <pre className="text-[10px] bg-background p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
