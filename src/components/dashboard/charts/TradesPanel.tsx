import { useState, useEffect } from 'react';
import { getUserOrders, UserOrderData, cancelOrder } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import BotsPanel from '../BotsPanel';
import BotsLogsPanel, { BotLogEntry } from '../BotsLogsPanel';

interface Position {
  id: number;
  pair: string;
  side: string;
  entry: number;
  current: number;
  size: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  status: string;
}

interface ClosedTrade {
  id: number;
  pair: string;
  side: string;
  entry: number;
  exit: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  closeTime: string;
}

interface StrategySignal {
  strategy: string;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  reason: string;
}

interface TradesPanelProps {
  positions: Position[];
  closedTrades: ClosedTrade[];
  strategySignals: StrategySignal[];
  botLogs: BotLogEntry[];
  onLogAdd: (log: BotLogEntry) => void;
  activeBotCount?: number;
  onBotCountChange?: (count: number) => void;
  onBotClick?: (pair: string) => void;
  userPositions?: Array<{symbol: string; side: string; entryPrice: number; unrealizedPnl: number}>;
  accountMode?: 'live' | 'demo';
  userId: number;
}

export default function TradesPanel({ positions, closedTrades, strategySignals, botLogs, onLogAdd, activeBotCount = 0, onBotCountChange, onBotClick, userPositions, accountMode = 'demo', userId }: TradesPanelProps) {
  const [tradeMode, setTradeMode] = useState<'live' | 'demo'>('demo');
  const [virtualTrades, setVirtualTrades] = useState<any[]>([]);
  const [loadingVirtual, setLoadingVirtual] = useState(false);
  const [orders, setOrders] = useState<UserOrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Load virtual trades
  useEffect(() => {
    if (tradeMode === 'demo') {
      loadVirtualTrades();
    } else {
      loadOrders();
    }
  }, [tradeMode, userId]);

  const loadVirtualTrades = async () => {
    try {
      setLoadingVirtual(true);
      const response = await fetch(`https://function.centerai.tech/api/virtual-trades?status=all&limit=100`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setVirtualTrades(data.trades);
      }
    } catch (error) {
      console.error('Failed to load virtual trades:', error);
    } finally {
      setLoadingVirtual(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const ordersData = await getUserOrders(userId, false);
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCancelOrder = async (orderId: string, symbol: string) => {
    try {
      const result = await cancelOrder(userId, orderId, symbol, 'linear');
      if (result.success) {
        toast.success('Ордер отменен');
        loadOrders();
      } else {
        toast.error(result.error || 'Ошибка отмены ордера');
      }
    } catch (error) {
      toast.error('Ошибка отмены ордера');
      console.error('Cancel order error:', error);
    }
  };

  const displayTrades = tradeMode === 'demo' 
    ? virtualTrades.filter(t => t.status === 'closed')
    : closedTrades;
  
  const displayPositions = tradeMode === 'demo'
    ? virtualTrades.filter(t => t.status === 'open')
    : positions;

  return (
    <Card className="bg-black/90 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base text-white">Сделки</CardTitle>
        <div className="flex items-center gap-2 bg-zinc-900/50 rounded-lg p-1">
          <Button
            size="sm"
            variant={tradeMode === 'live' ? 'default' : 'ghost'}
            className="h-7 text-xs"
            onClick={() => setTradeMode('live')}
          >
            <Icon name="Zap" size={12} className="mr-1" />
            Реальные
          </Button>
          <Button
            size="sm"
            variant={tradeMode === 'demo' ? 'default' : 'ghost'}
            className="h-7 text-xs"
            onClick={() => setTradeMode('demo')}
          >
            <Icon name="Gamepad2" size={12} className="mr-1" />
            Демо
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="orders" className="text-xs">
              <Icon name="FileText" size={14} className="mr-1.5" />
              Заявки ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="open" className="text-xs">
              <Icon name="CircleDot" size={14} className="mr-1.5" />
              Открытые ({displayPositions.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <Icon name="History" size={14} className="mr-1.5" />
              История ({displayTrades.length})
            </TabsTrigger>
            <TabsTrigger value="signals" className="text-xs">
              <Icon name="Activity" size={14} className="mr-1.5" />
              Сигналы ({strategySignals.length})
            </TabsTrigger>
            <TabsTrigger value="bots" className="text-xs">
              <Icon name="Bot" size={14} className="mr-1.5" />
              Боты ({activeBotCount})
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs">
              <Icon name="ScrollText" size={14} className="mr-1.5" />
              Логи ({botLogs.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="mt-4">
            {loadingOrders ? (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="Loader2" size={36} className="mx-auto mb-3 opacity-30 animate-spin" />
                <p className="text-sm">Загрузка заявок...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Нет активных заявок</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.orderId} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Badge variant={order.side === 'Buy' ? 'default' : 'destructive'} className="w-16 justify-center">
                        {order.side === 'Buy' ? 'LONG' : 'SHORT'}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{order.symbol}</span>
                          <Badge variant="outline" className="text-xs h-5">{order.orderType}</Badge>
                          <Badge variant="secondary" className="text-xs h-5">{order.orderStatus}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          Цена: ${order.price.toFixed(2)} • Объем: {order.qty} • Исполнено: {order.cumExecQty}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          Создан: {new Date(parseInt(order.createdTime)).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => handleCancelOrder(order.orderId, order.symbol)}
                    >
                      <Icon name="X" size={12} className="mr-1" />
                      Отменить
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="open" className="mt-4">
            {displayPositions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Нет открытых позиций</p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayPositions.map((position: any) => {
                  const isVirtual = 'is_demo' in position;
                  const displayPosition = isVirtual ? {
                    id: position.id,
                    pair: position.symbol,
                    side: position.side === 'Buy' ? 'LONG' : 'SHORT',
                    entry: position.entry_price,
                    current: position.entry_price, // Will need real-time price
                    size: position.quantity,
                    leverage: position.leverage,
                    pnl: 0, // Calculate later
                    pnlPercent: 0,
                    status: 'open'
                  } : position;
                  
                  return (
                  <div key={displayPosition.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Badge variant={displayPosition.side === 'LONG' ? 'default' : 'destructive'} className="w-16 justify-center">
                        {displayPosition.side}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{displayPosition.pair}</span>
                          {isVirtual && <Badge variant="outline" className="text-xs h-5">DEMO</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          Вход: ${displayPosition.entry} • Объем: {displayPosition.size} • {displayPosition.leverage}x
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          <span className="text-destructive">SL: -2.5%</span> • <span className="text-success">TP: +5.0%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="font-mono text-sm">${displayPosition.current}</div>
                        <div className="text-xs text-muted-foreground">Текущая</div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className={`font-mono font-semibold ${displayPosition.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {displayPosition.pnl >= 0 ? '+' : ''}{displayPosition.pnl.toFixed(2)} USDT
                        </div>
                        <div className={`text-xs ${displayPosition.pnlPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {displayPosition.pnlPercent >= 0 ? '+' : ''}{displayPosition.pnlPercent.toFixed(2)}%
                        </div>
                      </div>
                      <Button size="sm" variant="destructive" className="h-8">
                        <Icon name="X" size={14} className="mr-1" />
                        Закрыть
                      </Button>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="orders" className="mt-4">
            <div className="text-center text-muted-foreground py-8">
              <Icon name="FileText" size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Нет активных заявок</p>
              <p className="text-xs mt-1">Лимитные ордера будут отображаться здесь</p>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            {displayTrades.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Нет закрытых сделок</p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayTrades.map((trade: any) => {
                  const isVirtual = 'is_demo' in trade;
                  const displayTrade = isVirtual ? {
                    id: trade.id,
                    pair: trade.symbol,
                    side: trade.side === 'Buy' ? 'LONG' : 'SHORT',
                    entry: trade.entry_price,
                    exit: trade.close_price,
                    size: trade.quantity,
                    pnl: trade.pnl || 0,
                    pnlPercent: trade.pnl ? (trade.pnl / (trade.entry_price * trade.quantity) * 100) : 0,
                    closeTime: new Date(trade.closed_at).toLocaleString('ru-RU', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  } : trade;
                  
                  return (
                  <div key={displayTrade.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center space-x-4">
                      <Badge variant={displayTrade.side === 'LONG' ? 'outline' : 'outline'} className="w-16 justify-center">
                        {displayTrade.side}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{displayTrade.pair}</span>
                          {isVirtual && <Badge variant="outline" className="text-xs h-5 bg-green-500/10 border-green-500/30 text-green-600">DEMO</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {displayTrade.entry} → {displayTrade.exit} • {displayTrade.size} • {displayTrade.closeTime}
                        </div>
                      </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className={`font-mono font-semibold ${displayTrade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {displayTrade.pnl >= 0 ? '+' : ''}{displayTrade.pnl.toFixed(2)} USDT
                      </div>
                      <div className={`text-xs ${displayTrade.pnlPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {displayTrade.pnlPercent >= 0 ? '+' : ''}{displayTrade.pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="signals" className="mt-4">
            {strategySignals.filter(s => s.signal !== 'neutral' && s.strength > 50).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="Activity" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Нет активных сигналов</p>
                <p className="text-xs mt-2 opacity-70">Сигналы появятся при обнаружении точек входа</p>
              </div>
            ) : (
              <div className="space-y-2">
                {strategySignals
                  .filter(s => s.signal !== 'neutral' && s.strength > 50)
                  .map((signal, idx) => {
                    const signalColor = signal.signal === 'buy' ? 'text-success' : 'text-destructive';
                    const signalBg = signal.signal === 'buy' ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30';
                    const signalIcon = signal.signal === 'buy' ? 'TrendingUp' : 'TrendingDown';
                    
                    return (
                      <div key={idx} className={`p-3 rounded-lg border ${signalBg} hover:opacity-90 transition-opacity`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Icon name={signalIcon} size={18} className={signalColor} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-bold uppercase ${signalColor}`}>
                                  {signal.signal === 'buy' ? 'ПОКУПКА' : 'ПРОДАЖА'}
                                </span>
                                <Badge variant="outline" className="text-xs px-2 h-5">
                                  {signal.strength}%
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">{signal.strategy}</div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="h-8 text-xs">
                            Открыть
                          </Button>
                        </div>
                        <div className="text-xs text-foreground/70 pl-7">{signal.reason}</div>
                      </div>
                    );
                  })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="bots" className="mt-4">
            <BotsPanel onLogAdd={onLogAdd} onBotCountChange={onBotCountChange} onBotClick={onBotClick} userPositions={userPositions} accountMode={accountMode} userId={userId} />
          </TabsContent>
          
          <TabsContent value="logs" className="mt-4">
            <BotsLogsPanel logs={botLogs} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}