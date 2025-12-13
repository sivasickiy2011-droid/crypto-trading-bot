import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Scatter } from 'recharts';
import { CustomTooltip } from './PriceChartTooltip';

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

interface PriceChartMainProps {
  chartData: PriceDataPoint[];
  chartType: 'line' | 'candle';
  showIndicators: {
    ema9: boolean;
    ema21: boolean;
    ema50: boolean;
    rsi: boolean;
    bb: boolean;
    macd: boolean;
  };
  yMin: number;
  yMax: number;
}

export default function PriceChartMain({ chartData, chartType, showIndicators, yMin, yMax }: PriceChartMainProps) {
  return (
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
  );
}
