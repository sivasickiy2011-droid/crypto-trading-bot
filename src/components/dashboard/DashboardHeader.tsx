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
  apiMode: 'live' | 'testnet';
  onApiModeChange: (mode: 'live' | 'testnet') => void;
  accountMode: 'live' | 'demo';
  onAccountModeChange: (mode: 'live' | 'demo') => void;
  chartsEnabled: boolean;
  onChartsEnabledChange: (enabled: boolean) => void;
  signalsMode: 'disabled' | 'bots_only' | 'top10';
  onSignalsModeChange: (mode: 'disabled' | 'bots_only' | 'top10') => void;
  savedRequests: number;
  apiRequestsEnabled: boolean;
  onApiRequestsEnabledChange: (enabled: boolean) => void;
}

export default function DashboardHeader({
  botStatus,
  onBotStatusChange,
  username,
  userId,
  activeTab,
  onTabChange,
  apiMode,
  onApiModeChange,
  accountMode,
  onAccountModeChange,
  chartsEnabled,
  onChartsEnabledChange,
  signalsMode,
  onSignalsModeChange,
  savedRequests,
  apiRequestsEnabled,
  onApiRequestsEnabledChange
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
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.open('/test-trade', '_blank')}
            className="h-8"
          >
            <Icon name="TestTube2" size={16} className="mr-1.5" />
            Тест
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1 rounded-md border border-border bg-secondary/50">
          <span className="text-xs text-muted-foreground">API:</span>
          <Switch 
            checked={apiRequestsEnabled} 
            onCheckedChange={onApiRequestsEnabledChange}
            className="scale-75"
          />
          {apiRequestsEnabled ? (
            <span className="text-xs text-green-400">Вкл</span>
          ) : (
            <span className="text-xs text-zinc-500">Выкл</span>
          )}
        </div>
        {savedRequests > 0 && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-md border border-green-500/30 bg-green-500/10">
            <Icon name="TrendingDown" size={14} className="text-green-400" />
            <span className="text-xs font-mono font-semibold text-green-400">
              -{savedRequests} запросов
            </span>
          </div>
        )}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-md border border-border bg-secondary/50">
          <span className="text-xs text-muted-foreground">Графики:</span>
          <Switch 
            checked={chartsEnabled} 
            onCheckedChange={onChartsEnabledChange}
            className="scale-75"
          />
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 rounded-md border border-border bg-secondary/50">
          <span className="text-xs text-muted-foreground">Сигналы:</span>
          <Button
            variant={signalsMode === 'disabled' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onSignalsModeChange('disabled')}
            className="h-6 px-2 text-xs"
          >
            Выкл
          </Button>
          <Button
            variant={signalsMode === 'bots_only' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onSignalsModeChange('bots_only')}
            className="h-6 px-2 text-xs"
          >
            Боты
          </Button>
          <Button
            variant={signalsMode === 'top10' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onSignalsModeChange('top10')}
            className="h-6 px-2 text-xs"
          >
            Топ-10
          </Button>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center space-x-2 px-3 py-1 rounded-md border border-border bg-secondary/50">
          <span className="text-xs text-muted-foreground">API:</span>
          <Button
            variant={apiMode === 'testnet' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onApiModeChange('testnet')}
            className="h-6 px-2 text-xs"
          >
            <Icon name="TestTube" size={12} className="mr-1" />
            Тестовый
          </Button>
          <Button
            variant={apiMode === 'live' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onApiModeChange('live')}
            className="h-6 px-2 text-xs"
          >
            <Icon name="Zap" size={12} className="mr-1" />
            Боевой
          </Button>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 rounded-md border border-border bg-secondary/50">
          <span className="text-xs text-muted-foreground">Счёт:</span>
          <Button
            variant={accountMode === 'demo' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onAccountModeChange('demo')}
            className="h-6 px-2 text-xs"
          >
            Демо
          </Button>
          <Button
            variant={accountMode === 'live' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onAccountModeChange('live')}
            className="h-6 px-2 text-xs"
          >
            Боевой
          </Button>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <LanguageSwitcher userId={userId} />
        <Separator orientation="vertical" className="h-6" />
        <div className="text-sm text-muted-foreground">{username}</div>
        <Separator orientation="vertical" className="h-6" />
        <Switch checked={botStatus} onCheckedChange={onBotStatusChange} />
      </div>
    </header>
  );
}