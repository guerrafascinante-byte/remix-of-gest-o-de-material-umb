import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Shield, Database, User, Save } from 'lucide-react';

const ConfiguracoesPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Perfil do Usuário
              </CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input defaultValue="Administrador EMBASA" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" defaultValue="admin@embasa.ba.gov.br" />
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Input defaultValue="Gestão de Materiais" />
              </div>
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notificações
              </CardTitle>
              <CardDescription>Configure alertas e notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Alertas de Divergência</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando há grande divergência
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Novas Reservas</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando uma reserva é criada
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Materiais em Falta</p>
                  <p className="text-sm text-muted-foreground">
                    Alertar quando estoque está baixo
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Resumo Semanal</p>
                  <p className="text-sm text-muted-foreground">
                    Receber relatório semanal por e-mail
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>Parâmetros gerais do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Limite de Divergência (%)</Label>
                <Input type="number" defaultValue="20" />
                <p className="text-xs text-muted-foreground">
                  Alerta quando divergência ultrapassa este percentual
                </p>
              </div>
              <div className="space-y-2">
                <Label>Período Padrão de Análise</Label>
                <Input type="number" defaultValue="30" />
                <p className="text-xs text-muted-foreground">
                  Dias para análise padrão nos relatórios
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Segurança
              </CardTitle>
              <CardDescription>Configurações de segurança da conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Alterar Senha
              </Button>
              <Button variant="outline" className="w-full">
                Configurar Autenticação em Dois Fatores
              </Button>
              <Button variant="outline" className="w-full">
                Ver Histórico de Acessos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ConfiguracoesPage;
