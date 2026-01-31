import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Upload, 
  ClipboardList,
  TrendingUp,
  Building2,
  PanelLeftClose,
  PanelLeft,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ClipboardList, label: 'Reservas', path: '/reservas' },
  { icon: Package, label: 'Estoque', path: '/materiais' },
  { icon: Upload, label: 'Upload', path: '/importar' },
  { icon: TrendingUp, label: 'Análises', path: '/analises' },
  { icon: AlertTriangle, label: 'Divergências', path: '/divergencias' },
  { icon: Building2, label: 'Empreiteiras', path: '/empreiteiras' },
  { icon: FileText, label: 'Importar PDF', path: '/importar-pdf' },
];

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "bg-card border-r border-border transition-all duration-200 flex-shrink-0 self-stretch",
          collapsed ? "w-12" : "w-48",
          className
        )}
      >
        <div className="h-full flex flex-col">
          <nav className="sticky top-0 z-10 bg-card p-2">
            <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const linkContent = (
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-xs",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-primary/90 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                </NavLink>
              );

              return (
                <li key={item.path}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
            </ul>
          </nav>
          
          <div className="flex-1" />
          
          <div className="mt-auto">
            <div className="p-1.5 border-t border-border/50">
              <Button
                variant="ghost"
                size="xs"
                className="w-full justify-center h-6"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <PanelLeft className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
              </Button>
            </div>

            {!collapsed && (
              <div className="p-1.5 border-t border-border/50">
                <p className="text-[9px] text-muted-foreground/70 text-center">EMBASA</p>
                <p className="text-[9px] text-muted-foreground/70 text-center truncate">Consórcio Nova Bolandeira II</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};
