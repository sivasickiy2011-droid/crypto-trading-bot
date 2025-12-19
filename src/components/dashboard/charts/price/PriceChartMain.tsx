import { useRef, useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { CustomTooltip } from './PriceChartTooltip';
import { CustomCursor } from './CustomCursor';
import VolumeProfileOverlay from './VolumeProfileOverlay';
import ChartGradients from './components/ChartGradients';
import ChartMainLines from './components/ChartMainLines';
import ChartIndicators from './components/ChartIndicators';
import ChartMarkers from './components/ChartMarkers';

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

interface OrderbookEntry {
  price: number;
  bidSize: number;
  askSize: number;
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

interface PriceChartMainProps {
  chartData: PriceDataPoint[];
  spotData?: PriceDataPoint[];
  futuresData?: PriceDataPoint[];
  marketType?: 'spot' | 'futures' | 'overlay';
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
  bestAsk?: number;
  bestBid?: number;
  orderbook?: OrderbookEntry[];
  userOrders?: Array<{orderId: string; symbol: string; side: string; price: number; orderStatus: string}>;
  userPositions?: Array<{symbol: string; side: string; entryPrice: number; unrealizedPnl: number; pnlPercent: number}>;
  maCrossoverSignals?: MACrossoverData | null;
}

export default function PriceChartMain({ 
  chartData, 
  spotData = [], 
  futuresData = [], 
  marketType = 'futures', 
  chartType, 
  showIndicators, 
  yMin, 
  yMax, 
  positionLevels = [], 
  currentMarketPrice, 
  bestAsk, 
  bestBid, 
  orderbook = [], 
  userOrders = [], 
  userPositions = [], 
  maCrossoverSignals = null 
}: PriceChartMainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 1200, height: 480 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setChartDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <VolumeProfileOverlay
        orderbook={orderbook}
        yMin={yMin}
        yMax={yMax}
        chartWidth={chartDimensions.width}
        chartHeight={chartDimensions.height}
        bestBid={bestBid}
        bestAsk={bestAsk}
      />
      
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={chartData} 
          margin={{ top: 15, right: 150, left: 0, bottom: 10 }}
        >
          <ChartGradients />
          
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} horizontal={true} />
          
          <XAxis 
            dataKey="time" 
            stroke="rgba(255,255,255,0.3)" 
            tick={{ fontSize: 10, fontFamily: 'Roboto Mono', fill: 'rgba(255,255,255,0.4)' }}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis 
            stroke="rgba(255,255,255,0.1)" 
            tick={{ fontSize: 11, fontFamily: 'Roboto Mono', fill: 'rgba(255,255,255,0.5)' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            domain={[yMin, yMax]}
            tickFormatter={(value) => value.toFixed(4)}
            orientation="right"
            width={70}
            scale="linear"
          />
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={<CustomCursor chartHeight={chartDimensions.height} yMin={yMin} yMax={yMax} />}
          />
          
          <ChartMainLines 
            chartData={chartData}
            spotData={spotData}
            futuresData={futuresData}
            marketType={marketType}
            chartType={chartType}
            yMin={yMin}
            yMax={yMax}
          />
          
          <ChartIndicators showIndicators={showIndicators} />
          
          <ChartMarkers 
            chartData={chartData}
            bestAsk={bestAsk}
            bestBid={bestBid}
            maCrossoverSignals={maCrossoverSignals}
            userOrders={userOrders}
            userPositions={userPositions}
            positionLevels={positionLevels}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}