import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Scatter
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const Candlestick = (props: any) => {
  const { x, y, width, height, payload } = props;
  
  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isGreen = close >= open;
  const color = isGreen ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';
  const fill = isGreen ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';
  
  const yScale = height / (props.yMax - props.yMin);
  const xCenter = x + width / 2;
  
  const yHigh = y + height - ((high - props.yMin) * yScale);
  const yLow = y + height - ((low - props.yMin) * yScale);
  const yOpen = y + height - ((open - props.yMin) * yScale);
  const yClose = y + height - ((close - props.yMin) * yScale);
  
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.abs(yOpen - yClose);
  const bodyWidth = Math.max(width * 0.7, 2);

  return (
    <g>
      <line 
        x1={xCenter} 
        y1={yHigh} 
        x2={xCenter} 
        y2={yLow} 
        stroke={color} 
        strokeWidth={1}
      />
      <rect 
        x={xCenter - bodyWidth / 2} 
        y={bodyTop} 
        width={bodyWidth} 
        height={Math.max(bodyHeight, 1)} 
        fill={fill}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

export default function DashboardCharts({ priceData, positions, selectedSymbol, onTimeframeChange, orderbook = [], strategySignals = [] }: DashboardChartsProps) {
  const [activeTimeframe, setActiveTimeframe] = useState('15');
  const [showIndicators, setShowIndicators] = useState({ ma20: true, ma50: true, signals: true });
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');

  const timeframes = [
    { label: '1 минута', value: '1' },
    { label: '5 минут', value: '5' },
    { label: '15 минут', value: '15' },
    { label: '1 час', value: '60' },
    { label: '4 часа', value: '240' },
    { label: '1 день', value: 'D' }
  ];

  const handleTimeframeChange = (tf: string) => {
    setActiveTimeframe(tf);
    onTimeframeChange(tf);
  };

  const maxBidSize = Math.max(...orderbook.map(o => o.bidSize), 1);
  const maxAskSize = Math.max(...orderbook.map(o => o.askSize), 1);

  const chartData = priceData.map((point, idx) => {
    const buySignals = strategySignals.filter(s => s.signal === 'buy');
    const sellSignals = strategySignals.filter(s => s.signal === 'sell');
    
    if (idx === priceData.length - 1) {
      return { 
        ...point,
        buySignal: buySignals.length > 0 ? point.price || point.close : undefined,
        sellSignal: sellSignals.length > 0 ? point.price || point.close : undefined
      };
    }
    return point;
  });

  const yMin = Math.min(...chartData.map(d => d.low || d.price));
  const yMax = Math.max(...chartData.map(d => d.high || d.price));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    const isCandle = data.open !== undefined;

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{data.time}</p>
        {isCandle ? (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono">
              <span className="text-muted-foreground">O:</span>
              <span className="text-foreground">{data.open?.toFixed(2)}</span>
              <span className="text-muted-foreground">H:</span>
              <span className="text-success">{data.high?.toFixed(2)}</span>
              <span className="text-muted-foreground">L:</span>
              <span className="text-destructive">{data.low?.toFixed(2)}</span>
              <span className="text-muted-foreground">C:</span>
              <span className="text-foreground font-semibold">{data.close?.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <p className="text-sm font-mono font-semibold">${data.price?.toFixed(2)}</p>
        )}
        {data.volume && (
          <p className="text-xs text-muted-foreground mt-1">Vol: {data.volume.toFixed(4)}</p>
        )}
      </div>
    );
  };

  return (
    <div className="col-span-2 space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-xl">{selectedSymbol}</CardTitle>
              <Badge variant="outline" className="text-xs font-mono">
                {chartData.length > 0 ? `$${(chartData[chartData.length - 1]?.close || chartData[chartData.length - 1]?.price)?.toFixed(2)}` : '—'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <Select value={activeTimeframe} onValueChange={handleTimeframeChange}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map(tf => (
                    <SelectItem key={tf.value} value={tf.value} className="text-xs">
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-1 border border-border rounded-md p-1">
                <Button
                  variant={chartType === 'line' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setChartType('line')}
                >
                  <Icon name="TrendingUp" size={14} />
                </Button>
                <Button
                  variant={chartType === 'candle' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setChartType('candle')}
                >
                  <Icon name="BarChart4" size={14} />
                </Button>
              </div>

              <div className="flex items-center space-x-1">
                <Badge 
                  variant={showIndicators.ma20 ? 'default' : 'outline'}
                  className="text-xs cursor-pointer h-6 px-2"
                  onClick={() => setShowIndicators(prev => ({ ...prev, ma20: !prev.ma20 }))}
                >
                  MA20
                </Badge>
                <Badge 
                  variant={showIndicators.ma50 ? 'default' : 'outline'}
                  className="text-xs cursor-pointer h-6 px-2"
                  onClick={() => setShowIndicators(prev => ({ ...prev, ma50: !prev.ma50 }))}
                >
                  MA50
                </Badge>
                <Badge 
                  variant={showIndicators.signals ? 'default' : 'outline'}
                  className="text-xs cursor-pointer h-6 px-2"
                  onClick={() => setShowIndicators(prev => ({ ...prev, signals: !prev.signals }))}
                >
                  <Icon name="Activity" size={12} className="mr-1" />
                  Сигналы
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(220, 9%, 50%)" 
                  tick={{ fontSize: 11, fontFamily: 'Roboto Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(220, 13%, 20%)' }}
                />
                <YAxis 
                  stroke="hsl(220, 9%, 50%)" 
                  tick={{ fontSize: 11, fontFamily: 'Roboto Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(220, 13%, 20%)' }}
                  domain={['auto', 'auto']}
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} />
                
                {chartType === 'line' && (
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(199, 89%, 48%)" 
                    fill="url(#colorPrice)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                
                {chartType === 'candle' && chartData.length > 0 && (
                  <Scatter
                    data={chartData}
                    shape={<Candlestick yMin={yMin} yMax={yMax} />}
                    isAnimationActive={false}
                  />
                )}

                {showIndicators.ma20 && (
                  <Line 
                    type="monotone" 
                    dataKey="ma20" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                
                {showIndicators.ma50 && (
                  <Line 
                    type="monotone" 
                    dataKey="ma50" 
                    stroke="hsl(0, 84%, 60%)" 
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                
                {showIndicators.signals && (
                  <>
                    <Scatter
                      dataKey="buySignal"
                      fill="hsl(142, 76%, 36%)"
                      shape={(props: any) => {
                        const { cx, cy } = props;
                        if (cy === undefined || cx === undefined) return null;
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={10} fill="hsl(142, 76%, 36%)" opacity={0.2} />
                            <circle cx={cx} cy={cy} r={6} fill="hsl(142, 76%, 36%)" />
                            <polygon 
                              points={`${cx},${cy - 14} ${cx + 6},${cy - 22} ${cx - 6},${cy - 22}`} 
                              fill="hsl(142, 76%, 36%)"
                            />
                          </g>
                        );
                      }}
                      isAnimationActive={false}
                    />
                    
                    <Scatter
                      dataKey="sellSignal"
                      fill="hsl(0, 84%, 60%)"
                      shape={(props: any) => {
                        const { cx, cy } = props;
                        if (cy === undefined || cx === undefined) return null;
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={10} fill="hsl(0, 84%, 60%)" opacity={0.2} />
                            <circle cx={cx} cy={cy} r={6} fill="hsl(0, 84%, 60%)" />
                            <polygon 
                              points={`${cx},${cy + 14} ${cx + 6},${cy + 22} ${cx - 6},${cy + 22}`} 
                              fill="hsl(0, 84%, 60%)"
                            />
                          </g>
                        );
                      }}
                      isAnimationActive={false}
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {positions.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Открытые позиции</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {positions.map((position) => (
              <div key={position.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors">
                <div className="flex items-center space-x-4">
                  <Badge variant={position.side === 'LONG' ? 'default' : 'destructive'} className="w-16 justify-center">
                    {position.side}
                  </Badge>
                  <div>
                    <div className="font-semibold">{position.pair}</div>
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
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Стакан ордеров</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-px">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2 pb-2 border-b border-border">
                <div className="flex-1 text-right pr-2">Bid</div>
                <div className="w-24 text-center">Цена</div>
                <div className="flex-1 text-left pl-2">Ask</div>
              </div>
              {orderbook.slice(0, 20).map((order, idx) => {
                const totalSize = order.askSize + order.bidSize;
                const isLargeOrder = totalSize > (maxBidSize + maxAskSize) * 0.3;
                const bidPercent = (order.bidSize / maxBidSize) * 100;
                const askPercent = (order.askSize / maxAskSize) * 100;
                
                return (
                  <div key={idx} className="flex items-center justify-between text-xs font-mono hover:bg-secondary/50 transition-colors">
                    <div className="flex-1 relative h-6">
                      <div 
                        className="absolute right-0 top-0 h-full bg-success/15"
                        style={{ width: `${bidPercent}%` }}
                      />
                      <div className={`relative z-10 text-right pr-2 py-1 ${isLargeOrder ? 'text-success font-semibold' : 'text-success/70'}`}>
                        {order.bidSize > 0 ? order.bidSize.toFixed(4) : ''}
                      </div>
                    </div>
                    <div className="w-24 text-center font-semibold text-foreground py-1">
                      {order.price.toFixed(2)}
                    </div>
                    <div className="flex-1 relative h-6">
                      <div 
                        className="absolute left-0 top-0 h-full bg-destructive/15"
                        style={{ width: `${askPercent}%` }}
                      />
                      <div className={`relative z-10 text-left pl-2 py-1 ${isLargeOrder ? 'text-destructive font-semibold' : 'text-destructive/70'}`}>
                        {order.askSize > 0 ? order.askSize.toFixed(4) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {orderbook.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Icon name="BookOpen" size={36} className="mx-auto mb-3 opacity-30" />
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
            <div className="space-y-2">
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
            {strategySignals.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Icon name="Activity" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Нет активных сигналов</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
