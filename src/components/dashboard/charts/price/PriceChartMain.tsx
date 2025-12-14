import React from 'react';
import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Scatter, ReferenceLine } from 'recharts';
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

interface PositionLevel {
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  side: 'LONG' | 'SHORT';
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
  positionLevels?: PositionLevel[];
  currentMarketPrice?: number;
}

export default function PriceChartMain({ chartData, chartType, showIndicators, yMin, yMax, positionLevels = [], currentMarketPrice }: PriceChartMainProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 15, right: 50, left: 0, bottom: 10 }}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.05)" vertical={true} horizontal={true} />
        <XAxis 
          dataKey="time" 
          stroke="rgba(255,255,255,0.3)" 
          tick={{ fontSize: 10, fontFamily: 'Roboto Mono', fill: 'rgba(255,255,255,0.4)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="rgba(255,255,255,0.3)" 
          tick={{ fontSize: 10, fontFamily: 'Roboto Mono', fill: 'rgba(255,255,255,0.4)' }}
          tickLine={false}
          axisLine={false}
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
              const { cx, cy, payload, index } = props;
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
              const color = isGreen ? '#16a34a' : '#ef4444';
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.abs(yOpen - yClose) || 1;
              
              // Calculate dynamic candle width based on chart width and data length
              const chartWidth = typeof window !== 'undefined' ? window.innerWidth * 0.6 : 1200;
              const candleSpacing = chartWidth / (chartData.length + 1);
              const bodyWidth = Math.max(Math.min(candleSpacing * 0.8, 16), 4); // Min 4px, max 16px, 80% of space
              
              return (
                <g>
                  <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={color} strokeWidth={1} opacity={0.8} />
                  <rect 
                    x={cx - bodyWidth / 2} 
                    y={bodyTop} 
                    width={bodyWidth} 
                    height={bodyHeight} 
                    fill={color} 
                    stroke="none"
                    opacity={0.95}
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
            stroke="#fbbf24" 
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
            opacity={0.8}
          />
        )}
        
        {showIndicators.ema21 && (
          <Line 
            type="monotone" 
            dataKey="ema21" 
            stroke="#a855f7" 
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
            opacity={0.8}
          />
        )}
        
        {showIndicators.ema50 && (
          <Line 
            type="monotone" 
            dataKey="ema50" 
            stroke="#3b82f6" 
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
            opacity={0.8}
          />
        )}
        
        {showIndicators.bb && (
          <>
            <Line 
              type="monotone" 
              dataKey="bbUpper" 
              stroke="#818cf8" 
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              isAnimationActive={false}
              opacity={0.5}
            />
            <Line 
              type="monotone" 
              dataKey="bbLower" 
              stroke="#818cf8" 
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              isAnimationActive={false}
              opacity={0.5}
            />
          </>
        )}

        {currentMarketPrice && (
          <ReferenceLine 
            y={currentMarketPrice} 
            stroke="#fbbf24" 
            strokeWidth={1.5}
            strokeDasharray="5 5"
            label={{ 
              value: `${currentMarketPrice.toFixed(2)}`, 
              position: 'insideTopRight',
              fill: '#fbbf24',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Roboto Mono',
              offset: 10
            }}
          />
        )}

        {positionLevels.map((level, idx) => (
          <React.Fragment key={idx}>
            <ReferenceLine 
              y={level.entryPrice} 
              stroke={level.side === 'LONG' ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'} 
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ 
                value: `Вход: $${level.entryPrice.toFixed(2)}`, 
                position: 'right',
                fill: level.side === 'LONG' ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)',
                fontSize: 11,
                fontWeight: 600
              }}
            />
            {level.stopLoss && (
              <ReferenceLine 
                y={level.stopLoss} 
                stroke="hsl(0, 84%, 60%)" 
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{ 
                  value: `SL: $${level.stopLoss.toFixed(2)}`, 
                  position: 'right',
                  fill: 'hsl(0, 84%, 60%)',
                  fontSize: 10
                }}
              />
            )}
            {level.takeProfit && (
              <ReferenceLine 
                y={level.takeProfit} 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{ 
                  value: `TP: $${level.takeProfit.toFixed(2)}`, 
                  position: 'right',
                  fill: 'hsl(142, 76%, 36%)',
                  fontSize: 10
                }}
              />
            )}
          </React.Fragment>
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}