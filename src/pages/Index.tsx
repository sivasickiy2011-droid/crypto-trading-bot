import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const mockPriceData = Array.from({ length: 50 }, (_, i) => ({
  time: `${9 + Math.floor(i / 12)}:${(i % 12) * 5}`.padEnd(5, '0'),
  price: 43000 + Math.random() * 2000 - 1000,
  ma20: 43200 + Math.sin(i / 10) * 500,
  ma50: 43100 + Math.cos(i / 15) * 400,
  signal: i % 15 === 0 ? (i % 30 === 0 ? 'buy' : 'sell') : null
}));

const mockPositions = [
  { id: 1, pair: 'BTC/USDT', side: 'LONG', entry: 43250, current: 43580, size: 0.5, leverage: 10, pnl: 165, pnlPercent: 7.62, status: 'active' },
  { id: 2, pair: 'ETH/USDT', side: 'SHORT', entry: 2280, current: 2265, size: 2, leverage: 5, pnl: 30, pnlPercent: 1.32, status: 'active' },
  { id: 3, pair: 'SOL/USDT', side: 'LONG', entry: 98.5, current: 101.2, size: 10, leverage: 3, pnl: 27, pnlPercent: 2.74, status: 'active' },
];

const mockClosedTrades = [
  { id: 4, pair: 'BTC/USDT', side: 'LONG', entry: 42800, exit: 43200, size: 0.3, pnl: 120, pnlPercent: 5.6, closeTime: '11:23' },
  { id: 5, pair: 'ETH/USDT', side: 'SHORT', entry: 2310, exit: 2290, size: 1.5, pnl: 30, pnlPercent: 1.3, closeTime: '10:45' },
  { id: 6, pair: 'XRP/USDT', side: 'LONG', entry: 0.52, exit: 0.495, size: 1000, pnl: -25, pnlPercent: -4.8, closeTime: '09:15' },
];

const mockWatchlist = [
  { symbol: 'BTC/USDT', price: 43580, change: 2.34, volume: '2.4B', signal: 'buy' },
  { symbol: 'ETH/USDT', price: 2265, change: -0.87, volume: '1.2B', signal: 'neutral' },
  { symbol: 'SOL/USDT', price: 101.2, change: 5.12, volume: '340M', signal: 'buy' },
  { symbol: 'BNB/USDT', price: 312.5, change: 1.23, volume: '180M', signal: 'sell' },
  { symbol: 'XRP/USDT', price: 0.495, change: -2.15, volume: '890M', signal: 'neutral' },
];

const mockLogs = [
  { time: '14:23:15', type: 'info', message: 'MA Crossover signal detected on BTC/USDT' },
  { time: '14:22:48', type: 'success', message: 'Position opened: LONG BTC/USDT at 43250' },
  { time: '14:20:33', type: 'warning', message: 'Stop-loss adjusted for ETH/USDT position' },
  { time: '14:18:12', type: 'info', message: 'Martingale level 2 triggered on SOL/USDT' },
  { time: '14:15:45', type: 'error', message: 'Insufficient balance for new position' },
  { time: '14:12:30', type: 'success', message: 'Position closed: SHORT ETH/USDT, PnL: +$30' },
];

export default function Index() {
  const [botStatus, setBotStatus] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState('ma-crossover');

  const totalPnL = mockPositions.reduce((sum, p) => sum + p.pnl, 0);
  const totalPnLPercent = (totalPnL / 10000) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 space-y-6">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="TrendingUp" size={24} className="text-primary-foreground" />
          </div>
          <Separator className="w-8" />
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent">
            <Icon name="LayoutDashboard" size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent">
            <Icon name="LineChart" size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent">
            <Icon name="Settings" size={20} />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent">
            <Icon name="LogOut" size={20} />
          </Button>
        </aside>

        <main className="flex-1">
          <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Trading Terminal</h1>
              <Badge variant={botStatus ? "default" : "secondary"} className="animate-pulse-subtle">
                <Icon name="Circle" size={8} className="mr-1.5 fill-current" />
                {botStatus ? 'BOT ACTIVE' : 'BOT STOPPED'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Server:</span>
                <span className="ml-2 text-success font-medium">Connected</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Latency:</span>
                <span className="ml-2 font-mono text-foreground">12ms</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Switch checked={botStatus} onCheckedChange={setBotStatus} />
            </div>
          </header>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Account Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">$24,580.00</div>
                  <p className="text-xs text-muted-foreground mt-1">Available: $18,420.00</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total PnL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold font-mono ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USDT
                  </div>
                  <p className={`text-xs mt-1 ${totalPnLPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Open Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">{mockPositions.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total exposure: 10x</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-success">68.4%</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 24h: 12/18 trades</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>BTC/USDT</CardTitle>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">1m</Badge>
                        <Badge variant="outline" className="text-xs">5m</Badge>
                        <Badge className="text-xs">15m</Badge>
                        <Badge variant="outline" className="text-xs">1h</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockPriceData}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                          <XAxis 
                            dataKey="time" 
                            stroke="hsl(220, 9%, 65%)" 
                            style={{ fontSize: '12px', fontFamily: 'Roboto Mono' }}
                          />
                          <YAxis 
                            stroke="hsl(220, 9%, 65%)" 
                            style={{ fontSize: '12px', fontFamily: 'Roboto Mono' }}
                            domain={['dataMin - 500', 'dataMax + 500']}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(220, 13%, 12%)', 
                              border: '1px solid hsl(220, 13%, 20%)',
                              borderRadius: '6px',
                              fontFamily: 'Roboto Mono'
                            }}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="hsl(199, 89%, 48%)" 
                            fill="url(#colorPrice)"
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="ma20" 
                            stroke="hsl(142, 76%, 36%)" 
                            strokeWidth={1.5}
                            dot={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="ma50" 
                            stroke="hsl(0, 84%, 60%)" 
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Open Positions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockPositions.map((position) => (
                        <div key={position.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                          <div className="flex items-center space-x-4">
                            <Badge variant={position.side === 'LONG' ? 'default' : 'destructive'} className="w-16 justify-center">
                              {position.side}
                            </Badge>
                            <div>
                              <div className="font-semibold">{position.pair}</div>
                              <div className="text-xs text-muted-foreground">
                                Entry: <span className="font-mono">${position.entry}</span> | 
                                Size: <span className="font-mono">{position.size}</span> | 
                                {position.leverage}x
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <div className="font-mono text-sm">${position.current}</div>
                              <div className="text-xs text-muted-foreground">Current</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-mono font-semibold ${position.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {position.pnl >= 0 ? '+' : ''}{position.pnl} USDT
                              </div>
                              <div className={`text-xs ${position.pnlPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%
                              </div>
                            </div>
                            <Button size="sm" variant="destructive">
                              <Icon name="X" size={14} className="mr-1" />
                              Close
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Watchlist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {mockWatchlist.map((item) => (
                          <div key={item.symbol} className="p-2.5 rounded hover:bg-secondary transition-colors cursor-pointer">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm">{item.symbol}</span>
                              <Badge 
                                variant={item.signal === 'buy' ? 'default' : item.signal === 'sell' ? 'destructive' : 'secondary'}
                                className="text-xs px-1.5 py-0"
                              >
                                {item.signal}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm">${item.price}</span>
                              <span className={`text-xs font-medium ${item.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {item.change >= 0 ? '+' : ''}{item.change}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">Vol: {item.volume}</div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Strategy Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Active Strategy</Label>
                      <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ma-crossover">MA Crossover</SelectItem>
                          <SelectItem value="martingale">Martingale</SelectItem>
                          <SelectItem value="combined">Combined Strategy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Enable MA Crossover</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Enable Martingale</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Auto Stop-Loss</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      <Icon name="Settings" size={16} className="mr-2" />
                      Configure Strategy
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Tabs defaultValue="history" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="history">Trade History</TabsTrigger>
                <TabsTrigger value="logs">System Logs</TabsTrigger>
                <TabsTrigger value="pairs">Manage Pairs</TabsTrigger>
              </TabsList>

              <TabsContent value="history">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Closed Positions (Today)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mockClosedTrades.map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                          <div className="flex items-center space-x-4">
                            <Badge variant={trade.side === 'LONG' ? 'default' : 'destructive'} className="w-16 justify-center text-xs">
                              {trade.side}
                            </Badge>
                            <div>
                              <div className="font-semibold text-sm">{trade.pair}</div>
                              <div className="text-xs text-muted-foreground">
                                Entry: <span className="font-mono">${trade.entry}</span> → 
                                Exit: <span className="font-mono">${trade.exit}</span>
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
                    <CardTitle>System Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2 font-mono text-xs">
                        {mockLogs.map((log, i) => (
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
                    <CardTitle>Manage Trading Pairs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {mockWatchlist.map((item) => (
                        <div key={item.symbol} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary">
                          <span className="font-semibold text-sm">{item.symbol}</span>
                          <Switch defaultChecked />
                        </div>
                      ))}
                      <Button variant="outline" className="h-auto py-3">
                        <Icon name="Plus" size={16} className="mr-2" />
                        Add Pair
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
