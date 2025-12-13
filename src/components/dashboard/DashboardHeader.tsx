import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface DashboardHeaderProps {
  botStatus: boolean;
  onBotStatusChange: (status: boolean) => void;
  username: string;
  userId: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardHeader({
  botStatus,
  onBotStatusChange,
  username,
  userId,
  activeTab,
  onTabChange
}: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold">Торговый терминал</h1>
        <Badge variant={botStatus ? "default" : "secondary"} className="animate-pulse-subtle">
          <Icon name="Circle" size={8} className="mr-1.5 fill-current" />
          {botStatus ? 'БОТ АКТИВЕН' : 'БОТ ОСТАНОВЛЕН'}
        </Badge>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center space-x-2">
          <Button 
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => onTabChange('dashboard')}
            className="h-8"
          >
            <Icon name="LayoutDashboard" size={16} className="mr-1.5" />
            Дашборд
          </Button>
          <Button 
            variant={activeTab === 'backtest' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => onTabChange('backtest')}
            className="h-8"
          >
            <Icon name="LineChart" size={16} className="mr-1.5" />
            Бэктест
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <LanguageSwitcher userId={userId} />
        <Separator orientation="vertical" className="h-6" />
        <div className="text-sm">
          <span className="text-muted-foreground">Сервер:</span>
          <span className="ml-2 text-success font-medium">Подключен</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Задержка:</span>
          <span className="ml-2 font-mono text-foreground">12ms</span>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="text-sm text-muted-foreground">{username}</div>
        <Separator orientation="vertical" className="h-6" />
        <Switch checked={botStatus} onCheckedChange={onBotStatusChange} />
      </div>
    </header>
  );
}