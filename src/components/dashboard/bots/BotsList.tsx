import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Bot } from './useBotsManager';

interface BotsListProps {
  bots: Bot[];
  onToggleBot: (id: string) => void;
  onRemoveBot: (id: string) => void;
  onBotClick?: (pair: string) => void;
}

export default function BotsList({ bots, onToggleBot, onRemoveBot, onBotClick }: BotsListProps) {
  const { toast } = useToast();

  const getStatusBadge = (status: Bot['status']) => {
    switch (status) {
      case 'searching':
        return <Badge variant="secondary" className="text-[10px]">
          <Icon name="Search" size={10} className="mr-1" />
          Поиск точки входа
        </Badge>;
      case 'in_position':
        return <Badge variant="default" className="text-[10px]">
          <Icon name="TrendingUp" size={10} className="mr-1" />
          В позиции
        </Badge>;
      case 'stopped':
        return <Badge variant="outline" className="text-[10px]">
          <Icon name="Pause" size={10} className="mr-1" />
          Остановлен
        </Badge>;
    }
  };

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3">
        {bots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="Bot" size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Нет активных ботов</p>
            <p className="text-[10px] mt-1">Нажмите "MA Crossover стратегия" или "Другие" чтобы создать</p>
          </div>
        ) : (
          bots.map(bot => (
            <div 
              key={bot.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${bot.active ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'border-border bg-secondary/30 hover:bg-secondary/50'}`}
              onClick={() => {
                onBotClick?.(bot.pair.replace('/', ''));
                toast({
                  title: "График переключен",
                  description: `Открыт график для ${bot.pair}`,
                  duration: 2000,
                });
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm">{bot.pair}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                      {bot.market === 'spot' ? 'Спот' : 'Фьючерсы'}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-1">
                    Стратегия: {bot.strategy}
                  </div>
                  {getStatusBadge(bot.status)}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={bot.active} 
                    onCheckedChange={() => onToggleBot(bot.id)}
                    className="scale-75"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBot(bot.id);
                    }}
                  >
                    <Icon name="Trash2" size={12} className="text-destructive" />
                  </Button>
                </div>
              </div>

              {bot.status === 'searching' && bot.entrySignal && (
                <div className="mt-2 p-2 rounded bg-secondary/50 border border-border">
                  <div className="text-[9px] text-muted-foreground mb-0.5">Ожидаемый сигнал:</div>
                  <div className="text-[10px] text-foreground">{bot.entrySignal}</div>
                </div>
              )}

              {bot.status === 'in_position' && (
                <div className="mt-2 p-2 rounded bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Вход: ${bot.entryPrice}</span>
                    <span className={`font-mono font-semibold ${bot.currentPnL && bot.currentPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                      PnL: {bot.currentPnL && bot.currentPnL >= 0 ? '+' : ''}{bot.currentPnL}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
