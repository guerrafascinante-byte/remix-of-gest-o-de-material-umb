import { useNavigate } from 'react-router-dom';
import { Package, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { NotificationsDropdown } from './NotificationsDropdown';
import { MobileNav } from './MobileNav';

export const Header = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao sair',
        description: 'Ocorreu um erro ao tentar sair. Tente novamente.',
      });
    }
  };

  return (
    <header className="bg-card border-b border-border px-3 md:px-4 py-2 shadow-xs sticky top-0 z-50">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
          {/* Mobile hamburger menu */}
          <MobileNav />
          
          <div className="bg-primary p-1.5 rounded-md flex-shrink-0">
            <Package className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">
              <span className="hidden sm:inline">SGM - Sistema de Gestão de Materiais</span>
              <span className="sm:hidden">SGM</span>
            </h1>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
              EMBASA x Consórcio Nova Bolandeira II
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <NotificationsDropdown />
          
          <div className="flex items-center gap-1.5 pl-2 border-l border-border">
            <div className="bg-secondary p-1 rounded-full hidden sm:flex">
              <User className="h-3 w-3 text-secondary-foreground" />
            </div>
            <div className="text-xs hidden sm:block">
              <p className="font-medium text-foreground max-w-[80px] truncate">{profile?.name || 'Usuário'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
