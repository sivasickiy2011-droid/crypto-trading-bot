import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PriceChartHeader from './price/PriceChartHeader';
import TradingViewChart from './price/TradingViewChart';
import PriceChartIndicators from './price/PriceChartIndicators';
import { useMACrossoverSignals } from '@/hooks/useMACrossoverSignals';

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

interface PriceChartProps {
  priceData: Array<PriceDataPoint>;
  spotData?: Array<PriceDataPoint>;
  futuresData?: Array<PriceDataPoint>;
  selectedSymbol: string;
  onTimeframeChange: (timeframe: string) => void;
  onMarketTypeChange?: (type: 'spot' | 'futures' | 'overlay') => void;
  strategySignals?: Array<{strategy: string, signal: 'buy' | 'sell' | 'neutral', strength: number, reason: string}>;
  positionLevels?: PositionLevel[];
  currentMarketPrice?: number;
  bestAsk?: number;
  bestBid?: number;
  orderbook?: OrderbookEntry[];
  userOrders?: Array<{orderId: string; symbol: string; side: string; price: number; orderStatus: string}>;
  userPositions?: Array<{symbol: string; side: string; entryPrice: number; unrealizedPnl: number; pnlPercent: number}>;
}

export default function PriceChart({ priceData, spotData = [], futuresData = [], selectedSymbol, onTimeframeChange, onMarketTypeChange, strategySignals = [], positionLevels = [], currentMarketPrice, bestAsk, bestBid, orderbook = [], userOrders = [], userPositions = [] }: PriceChartProps) {
  const { data: maCrossoverData } = useMACrossoverSignals(priceData, selectedSymbol, true);
  const [activeTimeframe, setActiveTimeframe] = useState('15');
  const [showIndicators, setShowIndicators] = useState({ 
    ema9: false, 
    ema21: false, 
    ema50: false, 
    rsi: true, 
    bb: false, 
    macd: false 
  });
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');
  const [marketType, setMarketType] = useState<'spot' | 'futures' | 'overlay'>('futures');

  const handleMarketTypeChange = (type: 'spot' | 'futures' | 'overlay') => {
    setMarketType(type);
    if (onMarketTypeChange) {
      onMarketTypeChange(type);
    }
  };

  const handleTimeframeChange = (tf: string) => {
    setActiveTimeframe(tf);
    onTimeframeChange(tf);
  };

  const currentPrice = priceData.length > 0 ? (priceData[priceData.length - 1]?.close || priceData[priceData.length - 1]?.price) : 0;

  const hasVolumeData = priceData.some(d => d.volume && d.volume > 0);

  return (
    <Card className="bg-black/90 border-zinc-800">
      <CardHeader className="pb-2">
        <PriceChartHeader
          selectedSymbol={selectedSymbol}
          currentPrice={currentPrice}
          marketType={marketType}
          setMarketType={handleMarketTypeChange}
          activeTimeframe={activeTimeframe}
          onTimeframeChange={handleTimeframeChange}
          chartType={chartType}
          setChartType={setChartType}
          showIndicators={showIndicators}
          setShowIndicators={setShowIndicators}
        />
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="h-[580px] bg-black/50 rounded-md overflow-hidden">
          <TradingViewChart
            chartData={priceData}
            chartType={chartType}
            showIndicators={showIndicators}
            userOrders={userOrders}
            userPositions={userPositions}
            maCrossoverSignals={maCrossoverData}
            bestAsk={bestAsk}
            bestBid={bestBid}
          />
        </div>
        
        <PriceChartIndicators
          chartData={priceData}
          showRSI={showIndicators.rsi}
          showMACD={showIndicators.macd}
          showVolume={hasVolumeData}
        />
      </CardContent>
    </Card>
  );
}