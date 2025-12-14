import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { BotLogEntry } from './BotsLogsPanel';
import { useToast } from '@/hooks/use-toast';
import { sendTelegramNotification, getUserBots, createBot, updateBot, deleteBot } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Bot {
  id: string;
  pair: string;
  market: 'spot' | 'futures';
  strategy: string;
  status: 'searching' | 'in_position' | 'stopped';
  active: boolean;
  entrySignal?: string;
  currentPnL?: number;
  entryPrice?: number;
}

interface BotsPanelProps {
  onLogAdd: (log: BotLogEntry) => void;
  onBotCountChange?: (count: number) => void;
  onBotClick?: (pair: string) => void;
  userPositions?: Array<{symbol: string; side: string; entryPrice: number; unrealizedPnl: number}>;
  accountMode?: 'live' | 'demo';
  userId: number;
}

export default function BotsPanel({ onLogAdd, onBotCountChange, onBotClick, userPositions = [], accountMode = 'demo', userId }: BotsPanelProps) {
  const { toast } = useToast();
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newBotOpen, setNewBotOpen] = useState(false);
  const [newBot, setNewBot] = useState({
    pair: 'BTC/USDT',
    market: 'futures' as 'spot' | 'futures',
    strategy: 'ma-crossover'
  });

  useEffect(() => {
    const loadBots = async () => {
      try {
        const loadedBots = await getUserBots(userId);
        setBots(loadedBots.map(b => ({
          ...b,
          status: b.active ? 'searching' as const : 'stopped' as const
        })));
      } catch (error) {
        console.error('Failed to load bots:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBots();
  }, [userId]);

  useEffect(() => {
    const updatedBots = bots.map(bot => {
      const pairSymbol = bot.pair.replace('/', '');
      const position = userPositions.find(p => p.symbol === pairSymbol);
      
      const wasSearching = bot.status === 'searching';
      const wasInPosition = bot.status === 'in_position';
      
      if (position && bot.active) {
        if (wasSearching) {
          sendTelegramNotification({
            type: 'position_entry',
            symbol: pairSymbol,
            side: position.side,
            market: bot.market,
            mode: accountMode,
            entryPrice: position.entryPrice,
            size: position.size,
            leverage: position.leverage
          }).catch(err => console.error('Failed to send Telegram notification:', err));
          
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          onLogAdd({
            id: Date.now().toString() + Math.random(),
            botId: bot.id,
            botName: `${bot.pair} (${bot.strategy})`,
            timestamp: timeStr,
            type: 'entry',
            message: `Открыта позиция ${position.side}`,
            details: {
              price: position.entryPrice
            }
          });
        }
        
        return {
          ...bot,
          status: 'in_position' as const,
          entryPrice: position.entryPrice,
          currentPnL: position.unrealizedPnl
        };
      } else if (bot.active) {
        if (wasInPosition && bot.entryPrice) {
          const exitPrice = userPositions.find(p => p.symbol === pairSymbol)?.currentPrice || 0;
          const pnl = bot.currentPnL || 0;
          const pnlPercent = bot.entryPrice > 0 ? (pnl / bot.entryPrice) * 100 : 0;
          
          sendTelegramNotification({
            type: 'position_exit',
            symbol: pairSymbol,
            side: bot.entrySignal || 'LONG',
            mode: accountMode,
            entryPrice: bot.entryPrice,
            exitPrice: exitPrice,
            pnl: pnl,
            pnlPercent: pnlPercent,
            reason: 'Закрытие позиции'
          }).catch(err => console.error('Failed to send exit notification:', err));
          
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          onLogAdd({
            id: Date.now().toString() + Math.random(),
            botId: bot.id,
            botName: `${bot.pair} (${bot.strategy})`,
            timestamp: timeStr,
            type: 'exit',
            message: `Закрыта позиция с PnL ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT`,
            details: {
              pnl: pnl,
              pnlPercent: pnlPercent
            }
          });
        }
        
        return {
          ...bot,
          status: 'searching' as const,
          entryPrice: undefined,
          currentPnL: undefined
        };
      }
      
      return bot;
    });
    
    const hasChanges = JSON.stringify(updatedBots) !== JSON.stringify(bots);
    if (hasChanges) {
      setBots(updatedBots);
    }
    
    const activeCount = updatedBots.filter(b => b.active).length;
    onBotCountChange?.(activeCount);
  }, [userPositions, bots, onBotCountChange, accountMode, onLogAdd]);

  const toggleBot = async (id: string) => {
    const bot = bots.find(b => b.id === id);
    if (!bot) return;
    
    const newActive = !bot.active;
    
    try {
      await updateBot(userId, id, newActive);
      
      setBots(prev => {
        const updated = prev.map(b => {
          if (b.id === id) {
            const newStatus = newActive ? 'searching' as const : 'stopped' as const;
            
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            
            onLogAdd({
              id: Date.now().toString(),
              botId: b.id,
              botName: `${b.pair} (${b.strategy})`,
              timestamp: timeStr,
              type: 'info',
              message: newActive ? 'Бот запущен и начал поиск точки входа' : 'Бот остановлен'
            });
            
            return { ...b, active: newActive, status: newStatus };
          }
          return b;
        });
        const activeCount = updated.filter(b => b.active).length;
        onBotCountChange?.(activeCount);
        return updated;
      });
    } catch (error) {
      console.error('Failed to toggle bot:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус бота',
        variant: 'destructive'
      });
    }
  };

  const addBot = async () => {
    const strategies: { [key: string]: string } = {
      'ma-crossover': 'EMA 9/21/55 (тренд + кросс)',
      'rsi': 'RSI 14 + EMA50 (отбой от зон)',
      'bollinger': 'BB + EMA50 (отбой от границ)',
      'macd': 'MACD + EMA200 (дивергенция)'
    };

    const newBotData: Bot = {
      id: Date.now().toString(),
      pair: newBot.pair,
      market: newBot.market,
      strategy: strategies[newBot.strategy],
      status: 'searching',
      active: true
    };

    try {
      await createBot(userId, newBotData);
      
      setBots(prev => {
        const updated = [...prev, newBotData];
        const activeCount = updated.filter(b => b.active).length;
        onBotCountChange?.(activeCount);
        return updated;
      });
      
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      onLogAdd({
        id: Date.now().toString(),
        botId: newBotData.id,
        botName: `${newBotData.pair} (${newBotData.strategy})`,
        timestamp: timeStr,
        type: 'info',
        message: `Бот создан и запущен на ${newBotData.market === 'spot' ? 'споте' : 'фьючерсах'}`
      });
      
      setNewBotOpen(false);
    } catch (error) {
      console.error('Failed to create bot:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать бота',
        variant: 'destructive'
      });
    }
  };

  const removeBot = async (id: string) => {
    const bot = bots.find(b => b.id === id);
    if (!bot) return;
    
    try {
      await deleteBot(userId, id);
      
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      onLogAdd({
        id: Date.now().toString(),
        botId: bot.id,
        botName: `${bot.pair} (${bot.strategy})`,
        timestamp: timeStr,
        type: 'info',
        message: 'Бот удалён'
      });
      
      setBots(prev => {
        const updated = prev.filter(b => b.id !== id);
        const activeCount = updated.filter(b => b.active).length;
        onBotCountChange?.(activeCount);
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete bot:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить бота',
        variant: 'destructive'
      });
    }
  };
  


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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          <Icon name="TestTube" size={12} className="mr-1" />
          Только демо
        </Badge>
          <Dialog open={newBotOpen} onOpenChange={setNewBotOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs">
                <Icon name="Plus" size={14} className="mr-1" />
                Добавить бота
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Создать нового бота</DialogTitle>
                <DialogDescription>
                  Бот автоматически торгует по выбранной стратегии (LONG и SHORT позиции)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Торговая пара</Label>
                  <Select value={newBot.pair} onValueChange={(v) => setNewBot(prev => ({ ...prev, pair: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                      <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                      <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                      <SelectItem value="BNB/USDT">BNB/USDT</SelectItem>
                      <SelectItem value="XRP/USDT">XRP/USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Тип рынка</Label>
                  <Select value={newBot.market} onValueChange={(v: 'spot' | 'futures') => setNewBot(prev => ({ ...prev, market: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spot">Спот</SelectItem>
                      <SelectItem value="futures">Фьючерсы</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Стратегия</Label>
                  <Select value={newBot.strategy} onValueChange={(v) => setNewBot(prev => ({ ...prev, strategy: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ma-crossover">EMA 9/21/55 (тренд + кросс)</SelectItem>
                      <SelectItem value="rsi">RSI 14 + EMA50 (отбой от зон)</SelectItem>
                      <SelectItem value="bollinger">BB + EMA50 (отбой от границ)</SelectItem>
                      <SelectItem value="macd">MACD + EMA200 (дивергенция)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1" onClick={() => setNewBotOpen(false)}>
                  Отмена
                </Button>
                <Button className="flex-1" onClick={addBot}>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
      </div>
      
      <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {bots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Bot" size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Нет активных ботов</p>
                <p className="text-[10px] mt-1">Нажмите "Добавить бота" чтобы создать</p>
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
                        onCheckedChange={() => toggleBot(bot.id)}
                        className="scale-75"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeBot(bot.id)}
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
    </div>
  );
}