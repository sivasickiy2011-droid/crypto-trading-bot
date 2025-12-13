import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const mockBacktestResults = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  pnl: Math.random() * 400 - 100,
  equity: 10000 + (Math.random() * 3000 - 500) * i,
  trades: Math.floor(Math.random() * 10) + 5
}));

const mockTradeDistribution = [
  { range: '-10% to -5%', count: 3, color: '#ef4444' },
  { range: '-5% to 0%', count: 8, color: '#f97316' },
  { range: '0% to 5%', count: 15, color: '#22c55e' },
  { range: '5% to 10%', count: 12, color: '#10b981' },
  { range: '10%+', count: 5, color: '#059669' }
];

const mockMonthlyStats = [
  { month: 'Jan', profit: 1240, loss: -320, winRate: 72 },
  { month: 'Feb', profit: 980, loss: -450, winRate: 65 },
  { month: 'Mar', profit: 1560, loss: -280, winRate: 78 },
  { month: 'Apr', profit: 1120, loss: -390, winRate: 68 },
  { month: 'May', profit: 1680, loss: -210, winRate: 82 },
  { month: 'Jun', profit: 1340, loss: -520, winRate: 61 }
];

export default function BacktestPanel() {
  const [strategy, setStrategy] = useState('ma-crossover');
  const [timeframe, setTimeframe] = useState('3m');
  const [isRunning, setIsRunning] = useState(false);

  const totalPnL = mockBacktestResults.reduce((sum, d) => sum + d.pnl, 0);
  const totalTrades = mockBacktestResults.reduce((sum, d) => sum + d.trades, 0);
  const winningTrades = Math.floor(totalTrades * 0.68);
  const losingTrades = totalTrades - winningTrades;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backtesting Engine</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Test strategies on historical data before live trading
              </p>
            </div>
            <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "animate-pulse-subtle" : ""}>
              {isRunning ? 'RUNNING' : 'READY'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Strategy</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ma-crossover">MA Crossover</SelectItem>
                  <SelectItem value="martingale">Martingale</SelectItem>
                  <SelectItem value="combined">Combined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Last Month</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Initial Capital</Label>
              <Select defaultValue="10000">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5000">$5,000</SelectItem>
                  <SelectItem value="10000">$10,000</SelectItem>
                  <SelectItem value="25000">$25,000</SelectItem>
                  <SelectItem value="50000">$50,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                className="w-full" 
                onClick={() => {
                  setIsRunning(true);
                  setTimeout(() => setIsRunning(false), 3000);
                }}
                disabled={isRunning}
              >
                <Icon name={isRunning ? "Loader2" : "Play"} size={16} className={`mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? 'Running...' : 'Run Backtest'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Icon name="TrendingUp" size={20} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total PnL</p>
                <p className="text-xl font-bold font-mono text-success">
                  +${totalPnL.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Icon name="Percent" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-xl font-bold font-mono">
                  {((winningTrades / totalTrades) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Icon name="Activity" size={20} className="text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Trades</p>
                <p className="text-xl font-bold font-mono">{totalTrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <Icon name="TrendingDown" size={20} className="text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max Drawdown</p>
                <p className="text-xl font-bold font-mono text-destructive">-8.3%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockBacktestResults}>
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                    <XAxis 
                      dataKey="day" 
                      stroke="hsl(220, 9%, 65%)" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="hsl(220, 9%, 65%)" 
                      style={{ fontSize: '12px', fontFamily: 'Roboto Mono' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(220, 13%, 12%)', 
                        border: '1px solid hsl(220, 13%, 20%)',
                        borderRadius: '6px',
                        fontFamily: 'Roboto Mono'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="hsl(142, 76%, 36%)" 
                      fill="url(#colorEquity)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Daily PnL Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockBacktestResults.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                    <XAxis 
                      dataKey="day" 
                      stroke="hsl(220, 9%, 65%)" 
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis 
                      stroke="hsl(220, 9%, 65%)" 
                      style={{ fontSize: '12px', fontFamily: 'Roboto Mono' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(220, 13%, 12%)', 
                        border: '1px solid hsl(220, 13%, 20%)',
                        borderRadius: '6px',
                        fontFamily: 'Roboto Mono'
                      }}
                    />
                    <Bar 
                      dataKey="pnl" 
                      fill="hsl(199, 89%, 48%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Trade Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Winning Trades</span>
                  <span className="font-mono font-semibold text-success">{winningTrades}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Losing Trades</span>
                  <span className="font-mono font-semibold text-destructive">{losingTrades}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Win</span>
                  <span className="font-mono font-semibold text-success">+$124.50</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Loss</span>
                  <span className="font-mono font-semibold text-destructive">-$67.30</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profit Factor</span>
                  <span className="font-mono font-semibold">1.85</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                  <span className="font-mono font-semibold">2.34</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Return Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockTradeDistribution.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{item.range}</span>
                      <span className="text-xs font-mono">{item.count} trades</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{ 
                          width: `${(item.count / 43) * 100}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockMonthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(220, 9%, 65%)" 
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis 
                      stroke="hsl(220, 9%, 65%)" 
                      style={{ fontSize: '11px', fontFamily: 'Roboto Mono' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(220, 13%, 12%)', 
                        border: '1px solid hsl(220, 13%, 20%)',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="profit" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="loss" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
