import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { 
  Line, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ComposedChart, Scatter, Bar
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  ema9?: number;
  ema21?: number;
  ema50?: number;
  rsi?: number;
  bbUpper?: number;
  bbLower?: number;
  macd?: number;
  signal: string | null;
}

interface PriceChartProps {
  priceData: Array<PriceDataPoint>;
  selectedSymbol: string;
  onTimeframeChange: (timeframe: string) => void;
  strategySignals?: Array<{strategy: string, signal: 'buy' | 'sell' | 'neutral', strength: number, reason: string}>;
}

const Candlestick = (props: any) => {
  const { cx, cy, payload } = props;
  
  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low || cx === undefined || cy === undefined) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isGreen = close >= open;
  const color = isGreen ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';
  
  return (
    <g>
      <circle cx={cx} cy={cy} r={0} fill="transparent" />
    </g>
  );
};

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
      {(data.ema9 || data.ema21 || data.ema50 || data.rsi || data.bbUpper) && (
        <div className="border-t border-border mt-2 pt-2 space-y-0.5">
          {data.ema9 && <p className="text-xs"><span className="text-yellow-500">EMA9:</span> <span className="font-mono">{data.ema9.toFixed(2)}</span></p>}
          {data.ema21 && <p className="text-xs"><span className="text-success">EMA21:</span> <span className="font-mono">{data.ema21.toFixed(2)}</span></p>}
          {data.ema50 && <p className="text-xs"><span className="text-blue-500">EMA50:</span> <span className="font-mono">{data.ema50.toFixed(2)}</span></p>}
          {data.rsi && <p className="text-xs"><span className="text-purple-500">RSI:</span> <span className="font-mono">{data.rsi.toFixed(2)}</span></p>}
          {data.bbUpper && (
            <p className="text-xs">
              <span className="text-purple-500">BB:</span> 
              <span className="font-mono ml-1">{data.bbUpper.toFixed(2)} / {data.bbLower.toFixed(2)}</span>
            </p>
          )}
          {data.macd && <p className="text-xs"><span className="text-blue-500">MACD:</span> <span className="font-mono">{data.macd.toFixed(4)}</span></p>}
        </div>
      )}
    </div>
  );
};

export default function PriceChart({ priceData, selectedSymbol, onTimeframeChange, strategySignals = [] }: PriceChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState('15');
  const [showIndicators, setShowIndicators] = useState({ 
    ema9: false, 
    ema21: false, 
    ema50: false, 
    rsi: false, 
    bb: false, 
    macd: false 
  });
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const chartContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.deltaY) {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel(prev => {
          const newZoom = Math.max(0.5, Math.min(3, prev + delta));
          
          const dataLength = priceData.length;
          const visibleCount = Math.floor(dataLength / newZoom);
          setVisibleRange(prevRange => {
            const center = (prevRange.start + prevRange.end) / 2;
            const newStart = Math.max(0, Math.floor(center - visibleCount / 2));
            const newEnd = Math.min(dataLength, newStart + visibleCount);
            return { start: newStart, end: newEnd };
          });
          
          return newZoom;
        });
      }
    };

    chartContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      chartContainer.removeEventListener('wheel', handleWheel);
    };
  }, [priceData.length]);

  const chartData = priceData.slice(visibleRange.start, visibleRange.end).map((point, idx) => {
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

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-xl">{selectedSymbol}</CardTitle>
            <Badge variant="outline" className="text-xs font-mono">
              {chartData.length > 0 ? `$${(chartData[chartData.length - 1]?.close || chartData[chartData.length - 1]?.price)?.toFixed(2)}` : '—'}
            </Badge>
            <div className="flex items-center space-x-1 border border-border rounded-md p-1">
              <Button
                variant={marketType === 'spot' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setMarketType('spot')}
              >
                Спот
              </Button>
              <Button
                variant={marketType === 'futures' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setMarketType('futures')}
              >
                Фьючерсы
              </Button>
            </div>
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
                variant={showIndicators.ema9 ? 'default' : 'outline'}
                className="text-xs cursor-pointer h-6 px-2"
                onClick={() => setShowIndicators(prev => ({ ...prev, ema9: !prev.ema9 }))}
              >
                EMA9
              </Badge>
              <Badge 
                variant={showIndicators.ema21 ? 'default' : 'outline'}
                className="text-xs cursor-pointer h-6 px-2"
                onClick={() => setShowIndicators(prev => ({ ...prev, ema21: !prev.ema21 }))}
              >
                EMA21
              </Badge>
              <Badge 
                variant={showIndicators.ema50 ? 'default' : 'outline'}
                className="text-xs cursor-pointer h-6 px-2"
                onClick={() => setShowIndicators(prev => ({ ...prev, ema50: !prev.ema50 }))}
              >
                EMA50
              </Badge>
              <Badge 
                variant={showIndicators.rsi ? 'default' : 'outline'}
                className="text-xs cursor-pointer h-6 px-2"
                onClick={() => setShowIndicators(prev => ({ ...prev, rsi: !prev.rsi }))}
              >
                RSI
              </Badge>
              <Badge 
                variant={showIndicators.bb ? 'default' : 'outline'}
                className="text-xs cursor-pointer h-6 px-2"
                onClick={() => setShowIndicators(prev => ({ ...prev, bb: !prev.bb }))}
              >
                BB
              </Badge>
              <Badge 
                variant={showIndicators.macd ? 'default' : 'outline'}
                className="text-xs cursor-pointer h-6 px-2"
                onClick={() => setShowIndicators(prev => ({ ...prev, macd: !prev.macd }))}
              >
                MACD
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div 
          ref={chartContainerRef}
          className="h-[450px] overflow-hidden" 
          style={{ touchAction: 'none' }}
        >
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
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) return null;
                    
                    const chartHeight = 450;
                    const margin = 30;
                    const availableHeight = chartHeight - 2 * margin;
                    
                    const priceRange = yMax - yMin;
                    const pixelsPerUnit = availableHeight / priceRange;
                    
                    const yHigh = margin + (yMax - payload.high) * pixelsPerUnit;
                    const yLow = margin + (yMax - payload.low) * pixelsPerUnit;
                    const yOpen = margin + (yMax - payload.open) * pixelsPerUnit;
                    const yClose = margin + (yMax - payload.close) * pixelsPerUnit;
                    
                    const isGreen = payload.close >= payload.open;
                    const color = isGreen ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';
                    const bodyTop = Math.min(yOpen, yClose);
                    const bodyHeight = Math.abs(yOpen - yClose) || 1;
                    const bodyWidth = 8;
                    
                    return (
                      <g>
                        <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={color} strokeWidth={1.5} />
                        <rect 
                          x={cx - bodyWidth / 2} 
                          y={bodyTop} 
                          width={bodyWidth} 
                          height={bodyHeight} 
                          fill={color} 
                          stroke={color} 
                          strokeWidth={1}
                        />
                      </g>
                    );
                  }}
                  isAnimationActive={false}
                />
              )}

              {showIndicators.ema9 && (
                <Line 
                  type="monotone" 
                  dataKey="ema9" 
                  stroke="hsl(47, 100%, 50%)" 
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              
              {showIndicators.ema21 && (
                <Line 
                  type="monotone" 
                  dataKey="ema21" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              
              {showIndicators.ema50 && (
                <Line 
                  type="monotone" 
                  dataKey="ema50" 
                  stroke="hsl(199, 89%, 48%)" 
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              
              {showIndicators.bb && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="bbUpper" 
                    stroke="hsl(280, 70%, 60%)" 
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bbLower" 
                    stroke="hsl(280, 70%, 60%)" 
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}
              

            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {showIndicators.rsi && (
          <div className="h-[120px] mt-2">
            <div className="flex items-center justify-between mb-1 px-2">
              <span className="text-xs text-muted-foreground">RSI (14)</span>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-destructive">30</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-success">70</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(220, 9%, 50%)" 
                  tick={{ fontSize: 10 }}
                  hide
                />
                <YAxis 
                  stroke="hsl(220, 9%, 50%)" 
                  tick={{ fontSize: 10 }}
                  domain={[0, 100]}
                  ticks={[0, 30, 50, 70, 100]}
                  orientation="right"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value.toFixed(2), 'RSI']}
                />
                <Line 
                  type="monotone"
                  dataKey="rsi"
                  stroke="hsl(280, 70%, 60%)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone"
                  dataKey={() => 30}
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone"
                  dataKey={() => 70}
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {showIndicators.macd && (
          <div className="h-[120px] mt-2">
            <div className="flex items-center justify-between mb-1 px-2">
              <span className="text-xs text-muted-foreground">MACD Histogram</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(220, 9%, 50%)" 
                  tick={{ fontSize: 10 }}
                  hide
                />
                <YAxis 
                  stroke="hsl(220, 9%, 50%)" 
                  tick={{ fontSize: 10 }}
                  orientation="right"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value.toFixed(4), 'MACD']}
                />
                <Bar 
                  dataKey="macd"
                  fill="hsl(199, 89%, 48%)"
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone"
                  dataKey={() => 0}
                  stroke="hsl(220, 9%, 50%)"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}