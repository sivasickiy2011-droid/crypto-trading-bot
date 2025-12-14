import { useState } from 'react';
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
}

export default function TradesPanel({ positions, closedTrades, strategySignals, botLogs, onLogAdd, activeBotCount = 0, onBotCountChange, onBotClick, userPositions, accountMode = 'demo' }: TradesPanelProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base">Сделки</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="open" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="open" className="text-xs">
              <Icon name="CircleDot" size={14} className="mr-1.5" />
              Открытые ({positions.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <Icon name="History" size={14} className="mr-1.5" />
              История ({closedTrades.length})
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
          
          <TabsContent value="open" className="mt-4">
            {positions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Нет открытых позиций</p>
              </div>
            ) : (
              <div className="space-y-2">
                {positions.map((position) => (
                  <div key={position.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Badge variant={position.side === 'LONG' ? 'default' : 'destructive'} className="w-16 justify-center">
                        {position.side}
                      </Badge>
                      <div>
                        <div className="font-semibold text-sm">{position.pair}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          Вход: ${position.entry} • Объем: {position.size} • {position.leverage}x
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="font-mono text-sm">${position.current}</div>
                        <div className="text-xs text-muted-foreground">Текущая</div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className={`font-mono font-semibold ${position.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} USDT
                        </div>
                        <div className={`text-xs ${position.pnlPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                        </div>
                      </div>
                      <Button size="sm" variant="destructive" className="h-8">
                        <Icon name="X" size={14} className="mr-1" />
                        Закрыть
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            {closedTrades.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Нет закрытых сделок</p>
              </div>
            ) : (
              <div className="space-y-2">
                {closedTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center space-x-4">
                      <Badge variant={trade.side === 'LONG' ? 'outline' : 'outline'} className="w-16 justify-center">
                        {trade.side}
                      </Badge>
                      <div>
                        <div className="font-semibold text-sm">{trade.pair}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {trade.entry} → {trade.exit} • {trade.size} • {trade.closeTime}
                        </div>
                      </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className={`font-mono font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} USDT
                      </div>
                      <div className={`text-xs ${trade.pnlPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="signals" className="mt-4">
            {strategySignals.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="Activity" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Нет активных сигналов</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {strategySignals.map((signal, idx) => {
                  const signalColor = signal.signal === 'buy' ? 'text-success' : signal.signal === 'sell' ? 'text-destructive' : 'text-muted-foreground';
                  const signalBg = signal.signal === 'buy' ? 'bg-success/10 border-success/30' : signal.signal === 'sell' ? 'bg-destructive/10 border-destructive/30' : 'bg-secondary border-border';
                  const signalIcon = signal.signal === 'buy' ? 'TrendingUp' : signal.signal === 'sell' ? 'TrendingDown' : 'Minus';
                  
                  return (
                    <div key={idx} className={`p-3 rounded-lg border ${signalBg} hover:opacity-80 transition-opacity`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Icon name={signalIcon} size={16} className={signalColor} />
                          <span className="font-semibold text-sm">{signal.strategy}</span>
                        </div>
                        <Badge variant={signal.signal === 'buy' ? 'default' : signal.signal === 'sell' ? 'destructive' : 'outline'} className="text-xs h-5">
                          {signal.signal === 'buy' ? 'ПОКУПКА' : signal.signal === 'sell' ? 'ПРОДАЖА' : 'НЕЙТРАЛЬНО'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{signal.reason}</span>
                        <span className={`font-mono font-semibold ${signalColor}`}>
                          {signal.strength}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="bots" className="mt-4">
            <BotsPanel onLogAdd={onLogAdd} onBotCountChange={onBotCountChange} onBotClick={onBotClick} userPositions={userPositions} accountMode={accountMode} />
          </TabsContent>
          
          <TabsContent value="logs" className="mt-4">
            <BotsLogsPanel logs={botLogs} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}