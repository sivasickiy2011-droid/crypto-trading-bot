import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface StrategyMetrics {
  name: string;
  winRate: number;
  totalTrades: number;
  avgProfit: number;
  status: 'active' | 'paused' | 'optimizing';
}

interface StrategiesSidebarProps {
  strategies: StrategyMetrics[];
  autoMonitor: boolean;
  onAutoMonitorChange: (value: boolean) => void;
  onQuickAction: (prompt: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

const quickActions = [
  { label: 'Показать настройки', prompt: 'GET_CONFIG - покажи текущие настройки всех стратегий' },
  { label: 'Оптимизировать MA', prompt: 'Проанализируй стратегию MA Crossover и предложи лучшие параметры. Используй GET_CONFIG чтобы увидеть текущие настройки' },
  { label: 'Запустить бэктест', prompt: 'RUN_BACKTEST symbol=BTCUSDT strategy=ma-crossover period=7d - протестируй стратегию на истории' },
  { label: 'Риск-менеджмент', prompt: 'Оцени текущие настройки риск-менеджмента через GET_CONFIG и предложи улучшения' }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'paused': return 'bg-yellow-500';
    case 'optimizing': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

export default function StrategiesSidebar({
  strategies,
  autoMonitor,
  onAutoMonitorChange,
  onQuickAction,
  loading,
  onRefresh
}: StrategiesSidebarProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Стратегии</h3>
          <Button
            size="sm"
            variant={autoMonitor ? 'default' : 'outline'}
            onClick={() => onAutoMonitorChange(!autoMonitor)}
          >
            <Icon name={autoMonitor ? 'Pause' : 'Play'} size={14} className="mr-1" />
            {autoMonitor ? 'Пауза' : 'Авто'}
          </Button>
        </div>
        
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {strategies.map(strategy => (
              <Card key={strategy.name} className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{strategy.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(strategy.status)}`} />
                      <span className="text-xs text-muted-foreground capitalize">{strategy.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                  <div>
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className="font-bold text-green-500">{strategy.winRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Trades</p>
                    <p className="font-bold">{strategy.totalTrades}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Avg Profit</p>
                    <p className={`font-bold ${strategy.avgProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {strategy.avgProfit >= 0 ? '+' : ''}{strategy.avgProfit.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="p-4">
        <h3 className="font-bold text-sm mb-3">Быстрые действия</h3>
        <div className="space-y-2">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => onQuickAction(action.prompt)}
              disabled={loading}
            >
              <Icon name="Zap" size={12} className="mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
