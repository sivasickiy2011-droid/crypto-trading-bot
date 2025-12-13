import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { BotLogEntry } from './BotsLogsPanel';
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
}

export default function BotsPanel({ onLogAdd }: BotsPanelProps) {
  const [bots, setBots] = useState<Bot[]>([
    {
      id: '1',
      pair: 'BTC/USDT',
      market: 'futures',
      strategy: 'MA Crossover',
      status: 'searching',
      active: true,
      entrySignal: 'MA20 пересекла MA50 снизу вверх'
    },
    {
      id: '2',
      pair: 'ETH/USDT',
      market: 'futures',
      strategy: 'Мартингейл',
      status: 'in_position',
      active: true,
      entryPrice: 2265,
      currentPnL: 12.5
    }
  ]);

  const [newBotOpen, setNewBotOpen] = useState(false);
  const [newBot, setNewBot] = useState({
    pair: 'BTC/USDT',
    market: 'futures' as 'spot' | 'futures',
    strategy: 'ma-crossover'
  });

  const toggleBot = (id: string) => {
    setBots(prev => prev.map(bot => {
      if (bot.id === id) {
        const newActive = !bot.active;
        const newStatus = newActive ? 'searching' as const : 'stopped' as const;
        
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        onLogAdd({
          id: Date.now().toString(),
          botId: bot.id,
          botName: `${bot.pair} (${bot.strategy})`,
          timestamp: timeStr,
          type: 'info',
          message: newActive ? 'Бот запущен и начал поиск точки входа' : 'Бот остановлен'
        });
        
        return { ...bot, active: newActive, status: newStatus };
      }
      return bot;
    }));
  };

  const addBot = () => {
    const strategies: { [key: string]: string } = {
      'ma-crossover': 'MA Crossover',
      'martingale': 'Мартингейл',
      'grid': 'Сетка',
      'dca': 'DCA'
    };

    const newBotData: Bot = {
      id: Date.now().toString(),
      pair: newBot.pair,
      market: newBot.market,
      strategy: strategies[newBot.strategy],
      status: 'searching',
      active: true
    };

    setBots(prev => [...prev, newBotData]);
    
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
  };

  const removeBot = (id: string) => {
    const bot = bots.find(b => b.id === id);
    if (bot) {
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
    }
    setBots(prev => prev.filter(bot => bot.id !== id));
  };
  
  useEffect(() => {
    const interval = setInterval(() => {
      bots.forEach(bot => {
        if (!bot.active) return;
        
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        if (bot.status === 'searching' && Math.random() > 0.95) {
          onLogAdd({
            id: Date.now().toString() + Math.random(),
            botId: bot.id,
            botName: `${bot.pair} (${bot.strategy})`,
            timestamp: timeStr,
            type: 'signal',
            message: 'Получен сигнал для входа в позицию',
            details: {
              signal: bot.entrySignal || 'Условия стратегии выполнены'
            }
          });
        }
        
        if (bot.status === 'searching' && Math.random() > 0.98) {
          const entryPrice = 43500 + Math.random() * 1000;
          setBots(prev => prev.map(b => 
            b.id === bot.id ? { ...b, status: 'in_position' as const, entryPrice, currentPnL: 0 } : b
          ));
          
          onLogAdd({
            id: Date.now().toString() + Math.random(),
            botId: bot.id,
            botName: `${bot.pair} (${bot.strategy})`,
            timestamp: timeStr,
            type: 'entry',
            message: 'Открыта позиция LONG',
            details: {
              price: entryPrice
            }
          });
        }
        
        if (bot.status === 'in_position' && Math.random() > 0.97) {
          const exitPrice = (bot.entryPrice || 43500) * (1 + (Math.random() * 0.1 - 0.03));
          const pnl = ((exitPrice - (bot.entryPrice || 43500)) / (bot.entryPrice || 43500)) * 100;
          
          setBots(prev => prev.map(b => 
            b.id === bot.id ? { ...b, status: 'searching' as const, entryPrice: undefined, currentPnL: undefined } : b
          ));
          
          onLogAdd({
            id: Date.now().toString() + Math.random(),
            botId: bot.id,
            botName: `${bot.pair} (${bot.strategy})`,
            timestamp: timeStr,
            type: 'exit',
            message: pnl >= 0 ? 'Позиция закрыта с прибылью (тейк-профит)' : 'Позиция закрыта с убытком (стоп-лосс)',
            details: {
              price: exitPrice,
              pnl: pnl
            }
          });
        }
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [bots, onLogAdd]);

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
                  Бот будет работать только на демо счёте
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
                      <SelectItem value="ma-crossover">MA Crossover</SelectItem>
                      <SelectItem value="martingale">Мартингейл</SelectItem>
                      <SelectItem value="grid">Сетка ордеров</SelectItem>
                      <SelectItem value="dca">DCA усреднение</SelectItem>
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
                  className={`p-3 rounded-lg border ${bot.active ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'}`}
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