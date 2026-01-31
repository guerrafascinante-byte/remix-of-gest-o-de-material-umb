import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Upload, 
  ClipboardList,
  TrendingUp,
  Building2,
  AlertTriangle,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

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

export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-md">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">SGM</h2>
                <p className="text-[10px] text-muted-foreground">Gestão de Materiais</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-3 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-md transition-all text-sm",
                        "hover:bg-accent hover:text-accent-foreground",
                        "active:scale-[0.98]",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="mt-auto p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">EMBASA</p>
            <p className="text-xs text-muted-foreground text-center truncate">Consórcio Nova Bolandeira II</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
