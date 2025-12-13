import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

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

interface LogEntry {
  time: string;
  type: string;
  message: string;
}

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  volume: string;
  signal: string;
}

interface DashboardTabsProps {
  closedTrades: ClosedTrade[];
  logs: LogEntry[];
  watchlist: WatchlistItem[];
}

export default function DashboardTabs({ closedTrades, logs, watchlist }: DashboardTabsProps) {
  return (
    <Tabs defaultValue="history" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="history">История сделок</TabsTrigger>
        <TabsTrigger value="logs">Системные логи</TabsTrigger>
        <TabsTrigger value="pairs">Управление парами</TabsTrigger>
      </TabsList>

      <TabsContent value="history">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Закрытые позиции (сегодня)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {closedTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                  <div className="flex items-center space-x-4">
                    <Badge variant={trade.side === 'LONG' ? 'default' : 'destructive'} className="w-16 justify-center text-xs">
                      {trade.side}
                    </Badge>
                    <div>
                      <div className="font-semibold text-sm">{trade.pair}</div>
                      <div className="text-xs text-muted-foreground">
                        Вход: <span className="font-mono">${trade.entry}</span> → 
                        Выход: <span className="font-mono">${trade.exit}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-xs text-muted-foreground">{trade.closeTime}</div>
                    <div className={`font-mono font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl} USDT
                    </div>
                    <div className={`text-xs ${trade.pnlPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logs">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Системные логи</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 font-mono text-xs">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start space-x-3 p-2 rounded hover:bg-secondary">
                    <span className="text-muted-foreground whitespace-nowrap">{log.time}</span>
                    <Badge 
                      variant={
                        log.type === 'success' ? 'default' : 
                        log.type === 'error' ? 'destructive' : 
                        log.type === 'warning' ? 'secondary' : 'outline'
                      }
                      className="text-xs px-1.5 py-0 shrink-0"
                    >
                      {log.type.toUpperCase()}
                    </Badge>
                    <span className="text-foreground">{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pairs">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Управление торговыми парами</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {watchlist.map((item) => (
                <div key={item.symbol} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary">
                  <span className="font-semibold text-sm">{item.symbol}</span>
                  <Switch defaultChecked />
                </div>
              ))}
              <Button variant="outline" className="h-auto py-3">
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить пару
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
