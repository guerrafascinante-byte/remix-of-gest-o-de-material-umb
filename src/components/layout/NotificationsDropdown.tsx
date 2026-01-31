import { useState, useEffect, useCallback } from 'react';
import { Bell, Package, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'reserva' | 'divergencia';
  title: string;
  description: string;
  date: string;
  localidade?: string;
  mes?: string;
  materialId?: string;
}

export const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    const notifs: Notification[] = [];

    // Buscar uploads de liberação recentes (últimos 5)
    const { data: importacoes } = await supabase
      .from('historico_importacoes')
      .select('id, nome_arquivo, localidade, quantidade_registros, imported_at, mes_referencia')
      .eq('tipo_importacao', 'liberacao')
      .eq('status', 'Sucesso')
      .order('imported_at', { ascending: false })
      .limit(5);

    if (importacoes) {
      importacoes.forEach((imp) => {
        notifs.push({
          id: `reserva-${imp.id}`,
          type: 'reserva',
          title: imp.nome_arquivo,
          description: `${imp.localidade} - ${imp.quantidade_registros} registros`,
          date: imp.imported_at,
          localidade: imp.localidade,
          mes: imp.mes_referencia,
        });
      });
    }

    // Buscar divergências (materiais onde utilizado > liberado)
    const { data: divergencias } = await supabase
      .from('reservas')
      .select('id, numero_reserva, material_nome, localidade, quantidade_utilizada, quantidade_liberada, updated_at, mes_referencia')
      .gt('quantidade_utilizada', 0)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (divergencias) {
      divergencias
        .filter((d) => d.quantidade_utilizada > d.quantidade_liberada)
        .slice(0, 5)
        .forEach((d) => {
          const excesso = d.quantidade_utilizada - d.quantidade_liberada;
          notifs.push({
            id: `divergencia-${d.id}`,
            type: 'divergencia',
            title: `Divergência: ${d.material_nome?.substring(0, 25)}...`,
            description: `Excesso de ${excesso} unidades - ${d.localidade}`,
            date: d.updated_at,
            localidade: d.localidade,
            mes: d.mes_referencia,
            materialId: d.id,
          });
        });
    }

    // Ordenar por data mais recente
    notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setNotifications(notifs.slice(0, 8));
  }, []);

  // Carregar notificações iniciais
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Configurar Realtime
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'historico_importacoes',
        },
        (payload) => {
          console.log('Nova importação detectada:', payload);
          setHasNewNotification(true);
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservas',
        },
        (payload) => {
          const newData = payload.new as any;
          // Verificar se criou divergência
          if (newData.quantidade_utilizada > newData.quantidade_liberada) {
            console.log('Nova divergência detectada:', payload);
            setHasNewNotification(true);
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  // Limpar indicador de nova notificação quando abrir
  useEffect(() => {
    if (isOpen) {
      setHasNewNotification(false);
    }
  }, [isOpen]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Agora há pouco';
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
  };

  const clearNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);
    
    if (notification.type === 'reserva') {
      // Navegar para reservas com filtros
      const params = new URLSearchParams();
      if (notification.localidade) params.set('localidade', notification.localidade);
      if (notification.mes) params.set('mes', notification.mes);
      navigate(`/reservas${params.toString() ? `?${params.toString()}` : ''}`);
    } else if (notification.type === 'divergencia') {
      // Navegar para divergências
      const params = new URLSearchParams();
      if (notification.localidade) params.set('localidade', notification.localidade);
      if (notification.mes) params.set('mes', notification.mes);
      navigate(`/divergencias${params.toString() ? `?${params.toString()}` : ''}`);
    }
  };

  const reservaCount = notifications.filter((n) => n.type === 'reserva').length;
  const divergenciaCount = notifications.filter((n) => n.type === 'divergencia').length;
  const totalCount = notifications.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className={cn("h-4 w-4", hasNewNotification && "animate-bounce")} />
          {totalCount > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center",
              hasNewNotification && "animate-pulse"
            )}>
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-popover border border-border shadow-lg" 
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
          <div className="flex gap-3 mt-1">
            <span className="text-xs text-muted-foreground">
              <Package className="h-3 w-3 inline mr-1" />
              {reservaCount} reservas
            </span>
            <span className="text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              {divergenciaCount} divergências
            </span>
          </div>
        </div>

        <ScrollArea className="h-[280px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação no momento
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 hover:bg-accent/50 transition-colors group cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "p-1.5 rounded-md mt-0.5",
                        notification.type === 'reserva'
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {notification.type === 'reserva' ? (
                        <Package className="h-3.5 w-3.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(notification.date)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => clearNotification(notification.id, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-7"
              onClick={() => setNotifications([])}
            >
              Limpar todas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
