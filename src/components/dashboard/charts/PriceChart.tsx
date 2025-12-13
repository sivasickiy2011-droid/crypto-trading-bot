import { useState } from 'react';
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
    </div>
  );
};

export default function PriceChart({ priceData, selectedSymbol, onTimeframeChange, strategySignals = [] }: PriceChartProps) {
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

  return (
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
  );
}