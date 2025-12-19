import { Line, Area, Scatter } from 'recharts';

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

interface ChartMainLinesProps {
  chartData: PriceDataPoint[];
  spotData?: PriceDataPoint[];
  futuresData?: PriceDataPoint[];
  marketType: 'spot' | 'futures' | 'overlay';
  chartType: 'line' | 'candle';
  yMin: number;
  yMax: number;
}

export default function ChartMainLines({ chartData, spotData = [], futuresData = [], marketType, chartType, yMin, yMax }: ChartMainLinesProps) {
  return (
    <>
      {/* Overlay mode - show both spot and futures */}
      {marketType === 'overlay' && (
        <>
          <Line 
            type="monotone" 
            dataKey="spotClose"
            stroke="#10b981" 
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
            name="Спот"
          />
          <Line 
            type="monotone" 
            dataKey="futuresClose"
            stroke="#f59e0b" 
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
            name="Фьючерсы"
          />
        </>
      )}
      
      {chartType === 'line' && marketType !== 'overlay' && (
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
          dataKey="close"
          data={chartData}
          shape={(props: any) => {
            const { cx, cy, payload } = props;
            
            console.log('🕯️ Candle payload:', payload);
            
            if (!payload || payload.open === undefined || payload.close === undefined || payload.high === undefined || payload.low === undefined) {
              console.log('❌ Missing candle data:', payload);
              return null;
            }
            
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
            const color = isGreen ? '#10b981' : '#ef4444';
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.abs(yOpen - yClose) || 1.5;
            
            const chartWidth = typeof window !== 'undefined' ? window.innerWidth * 0.6 : 1200;
            const candleSpacing = chartWidth / (chartData.length + 1);
            const bodyWidth = Math.max(Math.min(candleSpacing * 0.75, 14), 3);
            
            return (
              <g>
                <line 
                  x1={cx} 
                  y1={yHigh} 
                  x2={cx} 
                  y2={yLow} 
                  stroke={color} 
                  strokeWidth={1.5} 
                  opacity={0.7} 
                />
                <rect 
                  x={cx - bodyWidth / 2} 
                  y={bodyTop} 
                  width={bodyWidth} 
                  height={bodyHeight} 
                  fill={color} 
                  stroke={color}
                  strokeWidth={0.5}
                  opacity={1}
                  rx={1}
                  ry={1}
                />
              </g>
            );
          }}
          isAnimationActive={false}
        />
      )}
    </>
  );
}