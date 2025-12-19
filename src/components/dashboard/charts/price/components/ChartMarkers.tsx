import React from 'react';
import { ReferenceLine, Scatter } from 'recharts';

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

interface MACrossoverSignal {
  index: number;
  type: 'BUY' | 'SELL';
  price: number;
  ema9: number;
  ema21: number;
  rsi: number;
  timestamp: string;
}

interface MACrossoverData {
  signals: MACrossoverSignal[];
  indicators: {
    ema9: number[];
    ema21: number[];
    rsi: number[];
  };
}

interface ChartMarkersProps {
  chartData: PriceDataPoint[];
  bestAsk?: number;
  bestBid?: number;
  maCrossoverSignals?: MACrossoverData | null;
  userOrders?: Array<{orderId: string; symbol: string; side: string; price: number; orderStatus: string}>;
  userPositions?: Array<{symbol: string; side: string; entryPrice: number; unrealizedPnl: number; pnlPercent: number}>;
  positionLevels?: PositionLevel[];
}

export default function ChartMarkers({ 
  chartData, 
  bestAsk, 
  bestBid, 
  maCrossoverSignals = null, 
  userOrders = [], 
  userPositions = [], 
  positionLevels = [] 
}: ChartMarkersProps) {
  return (
    <>
      {bestAsk && (
        <ReferenceLine 
          y={bestAsk} 
          stroke="#ef4444" 
          strokeWidth={1.5}
          label={{ 
            value: `${bestAsk.toFixed(4)}`, 
            position: 'right',
            fill: '#fff',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'Roboto Mono',
            style: { 
              backgroundColor: '#ef4444',
              padding: '2px 6px',
              borderRadius: '3px'
            }
          }}
        />
      )}

      {bestBid && (
        <ReferenceLine 
          y={bestBid} 
          stroke="#16a34a" 
          strokeWidth={1.5}
          label={{ 
            value: `${bestBid.toFixed(4)}`, 
            position: 'right',
            fill: '#fff',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'Roboto Mono',
            style: { 
              backgroundColor: '#16a34a',
              padding: '2px 6px',
              borderRadius: '3px'
            }
          }}
        />
      )}

      {/* MA Crossover Signals */}
      {maCrossoverSignals && maCrossoverSignals.signals && (
        <>
          {/* BUY Signals - Green triangles pointing up */}
          <Scatter
            data={maCrossoverSignals.signals
              .filter(s => s.type === 'BUY')
              .map(signal => {
                const dataPoint = chartData[signal.index];
                if (!dataPoint) return null;
                return {
                  time: dataPoint.time,
                  price: signal.price,
                  signalType: signal.type,
                  ema9: signal.ema9,
                  ema21: signal.ema21,
                  rsi: signal.rsi,
                  timestamp: signal.timestamp
                };
              })
              .filter(s => s !== null)
            }
            fill="#22c55e"
            dataKey="price"
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              if (!cx || !cy) return null;
              const size = 10;
              return (
                <g>
                  <path
                    d={`M ${cx} ${cy - size} L ${cx + size} ${cy + size} L ${cx - size} ${cy + size} Z`}
                    fill="#22c55e"
                    stroke="#16a34a"
                    strokeWidth={1.5}
                    opacity={0.9}
                  />
                  <title>{`BUY Signal\nPrice: ${payload?.price?.toFixed(4)}\nEMA9: ${payload?.ema9?.toFixed(4)}\nEMA21: ${payload?.ema21?.toFixed(4)}\nRSI: ${payload?.rsi?.toFixed(2)}`}</title>
                </g>
              );
            }}
            isAnimationActive={false}
          />
          
          {/* SELL Signals - Red triangles pointing down */}
          <Scatter
            data={maCrossoverSignals.signals
              .filter(s => s.type === 'SELL')
              .map(signal => {
                const dataPoint = chartData[signal.index];
                if (!dataPoint) return null;
                return {
                  time: dataPoint.time,
                  price: signal.price,
                  signalType: signal.type,
                  ema9: signal.ema9,
                  ema21: signal.ema21,
                  rsi: signal.rsi,
                  timestamp: signal.timestamp
                };
              })
              .filter(s => s !== null)
            }
            fill="#ef4444"
            dataKey="price"
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              if (!cx || !cy) return null;
              const size = 10;
              return (
                <g>
                  <path
                    d={`M ${cx} ${cy + size} L ${cx + size} ${cy - size} L ${cx - size} ${cy - size} Z`}
                    fill="#ef4444"
                    stroke="#dc2626"
                    strokeWidth={1.5}
                    opacity={0.9}
                  />
                  <title>{`SELL Signal\nPrice: ${payload?.price?.toFixed(4)}\nEMA9: ${payload?.ema9?.toFixed(4)}\nEMA21: ${payload?.ema21?.toFixed(4)}\nRSI: ${payload?.rsi?.toFixed(2)}`}</title>
                </g>
              );
            }}
            isAnimationActive={false}
          />
        </>
      )}

      {userOrders.map((order) => {
        const isLong = order.side === 'Buy';
        const color = isLong ? '#22c55e' : '#ef4444';
        
        return (
          <ReferenceLine 
            key={order.orderId}
            y={order.price} 
            stroke={color} 
            strokeWidth={2}
            strokeDasharray="5 5"
            opacity={0.7}
            label={{ 
              value: `📋 ${isLong ? 'LONG' : 'SHORT'} $${order.price.toFixed(2)}`, 
              position: 'insideTopRight',
              fill: color,
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'Roboto Mono'
            }}
          />
        );
      })}

      {userPositions.map((position) => {
        const isLong = position.side === 'Buy';
        const color = isLong ? '#22c55e' : '#ef4444';
        const pnlSign = position.pnlPercent >= 0 ? '+' : '';
        
        return (
          <ReferenceLine 
            key={position.symbol + position.side}
            y={position.entryPrice} 
            stroke={color} 
            strokeWidth={2.5}
            opacity={0.9}
            label={{ 
              value: `${isLong ? '🟢' : '🔴'} $${position.entryPrice.toFixed(2)} | ${pnlSign}${position.pnlPercent.toFixed(2)}%`, 
              position: 'insideTopRight',
              fill: color,
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'Roboto Mono'
            }}
          />
        );
      })}

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
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'Roboto Mono'
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
                fontSize: 9,
                fontFamily: 'Roboto Mono'
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
                fontSize: 9,
                fontFamily: 'Roboto Mono'
              }}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
}
