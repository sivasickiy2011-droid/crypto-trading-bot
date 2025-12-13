import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { getKlineData } from '@/lib/api';
import { runBacktest, BacktestResults, BacktestConfig } from '@/lib/backtest';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';



export default function BacktestPanel() {
  const [strategy, setStrategy] = useState<'ma-crossover' | 'rsi' | 'bollinger' | 'macd'>('ma-crossover');
  const [timeframe, setTimeframe] = useState('500');
  const [initialCapital, setInitialCapital] = useState('10000');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [positionSize, setPositionSize] = useState('10');
  const [leverage, setLeverage] = useState('1');
  const [stopLoss, setStopLoss] = useState('2');
  const [takeProfit, setTakeProfit] = useState('5');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResults | null>(null);

  const handleRunBacktest = async () => {
    setIsRunning(true);
    try {
      const klines = await getKlineData(symbol, '15', parseInt(timeframe));
      
      const config: BacktestConfig = {
        strategy,
        initialCapital: parseFloat(initialCapital),
        positionSize: parseFloat(positionSize),
        commission: 0.1,
        leverage: parseFloat(leverage),
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit)
      };

      const backtestResults = runBacktest(klines, config);
      setResults(backtestResults);
    } catch (error) {
      console.error('Backtest error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const tradeDistribution = results ? [
    { range: '-10% и ниже', count: results.trades.filter(t => t.pnlPercent < -10).length, color: '#dc2626' },
    { range: '-10% to -5%', count: results.trades.filter(t => t.pnlPercent >= -10 && t.pnlPercent < -5).length, color: '#ef4444' },
    { range: '-5% to 0%', count: results.trades.filter(t => t.pnlPercent >= -5 && t.pnlPercent < 0).length, color: '#f97316' },
    { range: '0% to 5%', count: results.trades.filter(t => t.pnlPercent >= 0 && t.pnlPercent < 5).length, color: '#22c55e' },
    { range: '5% to 10%', count: results.trades.filter(t => t.pnlPercent >= 5 && t.pnlPercent < 10).length, color: '#10b981' },
    { range: '10% и выше', count: results.trades.filter(t => t.pnlPercent >= 10).length, color: '#059669' }
  ] : [];

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Движок бэктестинга</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Тестируйте стратегии на исторических данных перед реальной торговлей
              </p>
            </div>
            <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "animate-pulse-subtle" : ""}>
              {isRunning ? 'ЗАПУЩЕН' : 'ГОТОВ'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Стратегия</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ma-crossover">Пересечение MA (20/50)</SelectItem>
                  <SelectItem value="rsi">RSI (30/70)</SelectItem>
                  <SelectItem value="bollinger">Bollinger Bands</SelectItem>
                  <SelectItem value="macd">MACD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Торговая пара</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                  <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                  <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Количество свечей</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200">200 свечей (~2 дня)</SelectItem>
                  <SelectItem value="500">500 свечей (~5 дней)</SelectItem>
                  <SelectItem value="1000">1000 свечей (~10 дней)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Начальный капитал ($)</Label>
              <Select value={initialCapital} onValueChange={setInitialCapital}>
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

            <div className="space-y-2">
              <Label>Размер позиции (%)</Label>
              <Select value={positionSize} onValueChange={setPositionSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5% капитала</SelectItem>
                  <SelectItem value="10">10% капитала</SelectItem>
                  <SelectItem value="20">20% капитала</SelectItem>
                  <SelectItem value="50">50% капитала</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Плечо</Label>
              <Select value={leverage} onValueChange={setLeverage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x (без плеча)</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="5">5x</SelectItem>
                  <SelectItem value="10">10x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Стоп-лосс (%)</Label>
              <Select value={stopLoss} onValueChange={setStopLoss}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1%</SelectItem>
                  <SelectItem value="2">2%</SelectItem>
                  <SelectItem value="3">3%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Тейк-профит (%)</Label>
              <Select value={takeProfit} onValueChange={setTakeProfit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                className="w-full" 
                onClick={handleRunBacktest}
                disabled={isRunning}
              >
                <Icon name={isRunning ? "Loader2" : "Play"} size={16} className={`mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? 'Выполняется...' : 'Запустить'}
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
                <p className="text-xs text-muted-foreground">Общий PnL</p>
                <p className={`text-xl font-bold font-mono ${results && results.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {results ? `${results.totalPnL >= 0 ? '+' : ''}$${results.totalPnL.toFixed(2)}` : '$0.00'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {results ? `${results.totalPnLPercent >= 0 ? '+' : ''}${results.totalPnLPercent.toFixed(2)}%` : '0%'}
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
                <p className="text-xs text-muted-foreground">Винрейт</p>
                <p className="text-xl font-bold font-mono">
                  {results ? results.winRate.toFixed(1) : '0.0'}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {results ? `${results.winningTrades}/${results.trades.length}` : '0/0'}
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
                <p className="text-xs text-muted-foreground">Всего сделок</p>
                <p className="text-xl font-bold font-mono">{results ? results.trades.length : 0}</p>
                <p className="text-xs text-muted-foreground">
                  Profit Factor: {results && results.profitFactor !== Infinity ? results.profitFactor.toFixed(2) : '0.00'}
                </p>
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
                <p className="text-xs text-muted-foreground">Макс. просадка</p>
                <p className="text-xl font-bold font-mono text-destructive">
                  {results ? `-${results.maxDrawdownPercent.toFixed(2)}%` : '0%'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sharpe: {results ? results.sharpeRatio.toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Кривая капитала</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {!results ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Icon name="BarChart3" size={48} className="mx-auto mb-3 opacity-30" />
                      <p>Запустите бэктест для просмотра результатов</p>
                    </div>
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.equityCurve.map((e, i) => ({ 
                    time: new Date(parseInt(e.time)).toLocaleString('ru', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    equity: e.equity,
                    pnl: e.pnl
                  }))}>
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                    <XAxis 
                      dataKey="time" 
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
                )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Последние 20 сделок</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {!results ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">Запустите бэктест</p>
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.trades.slice(-20).map((t, i) => ({
                    trade: `#${results.trades.length - 20 + i + 1}`,
                    pnl: t.pnl
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                    <XAxis 
                      dataKey="trade" 
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
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Статистика сделок</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Прибыльные сделки</span>
                  <span className="font-mono font-semibold text-success">{results ? results.winningTrades : 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Убыточные сделки</span>
                  <span className="font-mono font-semibold text-destructive">{results ? results.losingTrades : 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Сред. прибыль</span>
                  <span className="font-mono font-semibold text-success">{results ? `+$${results.avgWin.toFixed(2)}` : '$0.00'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Сред. убыток</span>
                  <span className="font-mono font-semibold text-destructive">{results ? `-$${results.avgLoss.toFixed(2)}` : '$0.00'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Фактор прибыли</span>
                  <span className="font-mono font-semibold">{results && results.profitFactor !== Infinity ? results.profitFactor.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Коэффициент Шарпа</span>
                  <span className="font-mono font-semibold">{results ? results.sharpeRatio.toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Распределение доходности</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tradeDistribution.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{item.range}</span>
                      <span className="text-xs font-mono">{item.count} сделок</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{ 
                          width: results && results.trades.length > 0 ? `${(item.count / results.trades.length) * 100}%` : '0%',
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
              <CardTitle>Ежемесячная доходность</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {!results || results.monthlyStats.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">Запустите бэктест</p>
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.monthlyStats}>
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
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}