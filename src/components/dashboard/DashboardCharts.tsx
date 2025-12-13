import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell, ComposedChart, Scatter
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface PriceDataPoint {
  time: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  ma20: number;
  ma50: number;
  signal: string | null;
}

interface DashboardChartsProps {
  priceData: Array<PriceDataPoint>;
  positions: Position[];
  selectedSymbol: string;
  onTimeframeChange: (timeframe: string) => void;
  orderbook?: Array<{price: number, bidSize: number, askSize: number}>;
  strategySignals?: Array<{strategy: string, signal: 'buy' | 'sell' | 'neutral', strength: number, reason: string}>;
}

export default function DashboardCharts({ priceData, positions, selectedSymbol, onTimeframeChange, orderbook = [], strategySignals = [] }: DashboardChartsProps) {
  const [activeTimeframe, setActiveTimeframe] = useState('15');
  const [showIndicators, setShowIndicators] = useState({ ma20: true, ma50: true, volume: false });
  const [chartType, setChartType] = useState<'line' | 'candle' | 'bar'>('line');

  const timeframes = [
    { label: '1m', value: '1' },
    { label: '5m', value: '5' },
    { label: '15m', value: '15' },
    { label: '1h', value: '60' },
    { label: '4h', value: '240' },
    { label: '1d', value: 'D' }
  ];

  const handleTimeframeChange = (tf: string) => {
    setActiveTimeframe(tf);
    onTimeframeChange(tf);
  };

  const maxBidSize = Math.max(...orderbook.map(o => o.bidSize), 1);
  const maxAskSize = Math.max(...orderbook.map(o => o.askSize), 1);

  const chartTypes = [
    { label: 'Линия', value: 'line' as const, icon: 'TrendingUp' },
    { label: 'Свечи', value: 'candle' as const, icon: 'BarChart4' },
    { label: 'Бары', value: 'bar' as const, icon: 'BarChart3' }
  ];

  const signalPoints = priceData.map((point, idx) => {
    const buySignals = strategySignals.filter(s => s.signal === 'buy');
    const sellSignals = strategySignals.filter(s => s.signal === 'sell');
    
    if (idx === priceData.length - 1 && buySignals.length > 0) {
      return { ...point, buySignal: point.price };
    } else if (idx === priceData.length - 1 && sellSignals.length > 0) {
      return { ...point, sellSignal: point.price };
    }
    return point;
  });

  const CandlestickBar = (props: any) => {
    const { x, y, width, height, open, close, high, low } = props;
    const isGreen = close > open;
    const color = isGreen ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';
    const yTop = Math.min(open, close);
    const bodyHeight = Math.abs(close - open);
    
    return (
      <g>
        <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} stroke={color} strokeWidth={1} />
        <rect x={x} y={yTop} width={width} height={bodyHeight} fill={color} stroke={color} strokeWidth={1} />
      </g>
    );
  };

  return (
    <div className="col-span-2 space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{selectedSymbol}</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {timeframes.map(tf => (
                  <Badge 
                    key={tf.value}
                    variant={activeTimeframe === tf.value ? 'default' : 'outline'}
                    className="text-xs cursor-pointer hover:bg-secondary"
                    onClick={() => handleTimeframeChange(tf.value)}
                  >
                    {tf.label}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center space-x-2 border-l border-border pl-4">
                {chartTypes.map(ct => (
                  <Badge 
                    key={ct.value}
                    variant={chartType === ct.value ? 'default' : 'outline'}
                    className="text-xs cursor-pointer hover:bg-secondary"
                    onClick={() => setChartType(ct.value)}
                  >
                    <Icon name={ct.icon} size={12} className="mr-1" />
                    {ct.label}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center space-x-2 border-l border-border pl-4">
                <Badge 
                  variant={showIndicators.ma20 ? 'default' : 'outline'}
                  className="text-xs cursor-pointer"
                  onClick={() => setShowIndicators(prev => ({ ...prev, ma20: !prev.ma20 }))}
                >
                  MA20
                </Badge>
                <Badge 
                  variant={showIndicators.ma50 ? 'default' : 'outline'}
                  className="text-xs cursor-pointer"
                  onClick={() => setShowIndicators(prev => ({ ...prev, ma50: !prev.ma50 }))}
                >
                  MA50
                </Badge>
                <Badge 
                  variant={showIndicators.volume ? 'default' : 'outline'}
                  className="text-xs cursor-pointer"
                  onClick={() => setShowIndicators(prev => ({ ...prev, volume: !prev.volume }))}
                >
                  Объём
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={signalPoints}>
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
                
                {chartType === 'line' && (
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(199, 89%, 48%)" 
                    fill="url(#colorPrice)"
                    strokeWidth={2}
                  />
                )}
                
                {chartType === 'candle' && (
                  <Bar 
                    dataKey="high" 
                    fill="hsl(142, 76%, 36%)" 
                    shape={<CandlestickBar />}
                  />
                )}
                
                {chartType === 'bar' && (
                  <Bar dataKey="close" fill="hsl(199, 89%, 48%)" />
                )}
                {showIndicators.ma20 && (
                  <Line 
                    type="monotone" 
                    dataKey="ma20" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={1.5}
                    dot={false}
                  />
                )}
                {showIndicators.ma50 && (
                  <Line 
                    type="monotone" 
                    dataKey="ma50" 
                    stroke="hsl(0, 84%, 60%)" 
                    strokeWidth={1.5}
                    dot={false}
                  />
                )}
                
                <Scatter
                  dataKey="buySignal"
                  fill="hsl(142, 76%, 36%)"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (cy === undefined) return null;
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={8} fill="hsl(142, 76%, 36%)" opacity={0.3} />
                        <circle cx={cx} cy={cy} r={5} fill="hsl(142, 76%, 36%)" />
                        <path d={`M ${cx} ${cy - 10} L ${cx + 6} ${cy - 18} L ${cx - 6} ${cy - 18} Z`} fill="hsl(142, 76%, 36%)" />
                      </g>
                    );
                  }}
                />
                
                <Scatter
                  dataKey="sellSignal"
                  fill="hsl(0, 84%, 60%)"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (cy === undefined) return null;
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={8} fill="hsl(0, 84%, 60%)" opacity={0.3} />
                        <circle cx={cx} cy={cy} r={5} fill="hsl(0, 84%, 60%)" />
                        <path d={`M ${cx} ${cy + 10} L ${cx + 6} ${cy + 18} L ${cx - 6} ${cy + 18} Z`} fill="hsl(0, 84%, 60%)" />
                      </g>
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {positions.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Открытые позиции</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {positions.map((position) => (
              <div key={position.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                <div className="flex items-center space-x-4">
                  <Badge variant={position.side === 'LONG' ? 'default' : 'destructive'} className="w-16 justify-center">
                    {position.side}
                  </Badge>
                  <div>
                    <div className="font-semibold">{position.pair}</div>
                    <div className="text-xs text-muted-foreground">
                      Вход: <span className="font-mono">${position.entry}</span> | 
                      Объем: <span className="font-mono">{position.size}</span> | 
                      {position.leverage}x
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="font-mono text-sm">${position.current}</div>
                    <div className="text-xs text-muted-foreground">Текущая</div>
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
                    Закрыть
                  </Button>
                </div>
              </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Стакан ордеров</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {orderbook.slice(0, 15).map((order, idx) => {
                const totalSize = order.askSize + order.bidSize;
                const isLargeOrder = totalSize > (maxBidSize + maxAskSize) * 0.3;
                const bidPercent = (order.bidSize / maxBidSize) * 100;
                const askPercent = (order.askSize / maxAskSize) * 100;
                
                return (
                  <div key={idx} className="flex items-center justify-between text-xs font-mono">
                    <div className="flex-1 relative">
                      <div 
                        className="absolute right-0 top-0 h-full bg-success/20"
                        style={{ width: `${bidPercent}%` }}
                      />
                      <div className={`relative z-10 text-right pr-2 py-1 ${isLargeOrder ? 'text-success font-semibold' : 'text-success/80'}`}>
                        {order.bidSize > 0 ? order.bidSize.toFixed(4) : ''}
                      </div>
                    </div>
                    <div className="w-24 text-center font-semibold text-foreground py-1">
                      {order.price.toFixed(2)}
                    </div>
                    <div className="flex-1 relative">
                      <div 
                        className="absolute left-0 top-0 h-full bg-destructive/20"
                        style={{ width: `${askPercent}%` }}
                      />
                      <div className={`relative z-10 text-left pl-2 py-1 ${isLargeOrder ? 'text-destructive font-semibold' : 'text-destructive/80'}`}>
                        {order.askSize > 0 ? order.askSize.toFixed(4) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {orderbook.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="BookOpen" size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Загрузка стакана...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Сигналы стратегий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategySignals.map((signal, idx) => {
                const signalColor = signal.signal === 'buy' ? 'text-success' : signal.signal === 'sell' ? 'text-destructive' : 'text-muted-foreground';
                const signalBg = signal.signal === 'buy' ? 'bg-success/10 border-success/30' : signal.signal === 'sell' ? 'bg-destructive/10 border-destructive/30' : 'bg-secondary border-border';
                const signalIcon = signal.signal === 'buy' ? 'TrendingUp' : signal.signal === 'sell' ? 'TrendingDown' : 'Minus';
                
                return (
                  <div key={idx} className={`p-3 rounded-lg border ${signalBg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Icon name={signalIcon} size={16} className={signalColor} />
                        <span className="font-semibold text-sm">{signal.strategy}</span>
                      </div>
                      <Badge variant={signal.signal === 'buy' ? 'default' : signal.signal === 'sell' ? 'destructive' : 'outline'} className="text-xs">
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
            {strategySignals.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="Activity" size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет активных сигналов</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}