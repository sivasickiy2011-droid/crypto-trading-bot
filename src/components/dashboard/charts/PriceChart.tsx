import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PriceChartHeader from './price/PriceChartHeader';
import PriceChartMain from './price/PriceChartMain';
import PriceChartIndicators from './price/PriceChartIndicators';

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
}

export default function PriceChart({ priceData, spotData = [], futuresData = [], selectedSymbol, onTimeframeChange, onMarketTypeChange, strategySignals = [], positionLevels = [], currentMarketPrice, bestAsk, bestBid, orderbook = [] }: PriceChartProps) {
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [priceZoom, setPriceZoom] = useState(1);
  const chartContainerRef = useRef<HTMLDivElement>(null);

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
        // Shift + колесико = вертикальный зум (по цене)
        if (e.shiftKey) {
          const delta = e.deltaY > 0 ? -0.15 : 0.15;
          setPriceZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
        } else {
          // Обычное колесико = горизонтальный зум (по времени)
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

  let baseYMin = Math.min(...chartData.map(d => d.low || d.price));
  let baseYMax = Math.max(...chartData.map(d => d.high || d.price));
  
  // Center chart around current bid/ask price
  let priceCenter = (baseYMin + baseYMax) / 2;
  if (bestBid && bestAsk) {
    priceCenter = (bestBid + bestAsk) / 2;
    baseYMin = Math.min(baseYMin, bestBid);
    baseYMax = Math.max(baseYMax, bestAsk);
  }
  
  // Apply price zoom centered on current price
  const priceRange = (baseYMax - baseYMin) / priceZoom;
  const yMin = priceCenter - priceRange / 2;
  const yMax = priceCenter + priceRange / 2;
  
  const currentPrice = chartData.length > 0 ? (chartData[chartData.length - 1]?.close || chartData[chartData.length - 1]?.price) : 0;

  // Check if volume data exists
  const hasVolumeData = chartData.some(d => d.volume && d.volume > 0);

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
        <div className="mb-2 px-2 py-1 bg-zinc-900/30 border border-zinc-800/50 rounded text-[10px] text-zinc-500 flex items-center gap-2">
          <span>💡 Зум: колесико мыши — по времени, Shift + колесико — по цене</span>
        </div>
        <div 
          ref={chartContainerRef}
          className="h-[480px] overflow-hidden bg-black/50 rounded-md" 
          style={{ touchAction: 'none' }}
        >
          <PriceChartMain
            chartData={chartData}
            spotData={spotData}
            futuresData={futuresData}
            marketType={marketType}
            chartType={chartType}
            showIndicators={showIndicators}
            yMin={yMin}
            yMax={yMax}
            positionLevels={positionLevels}
            currentMarketPrice={currentMarketPrice}
            bestAsk={bestAsk}
            bestBid={bestBid}
            orderbook={orderbook}
          />
        </div>
        
        <PriceChartIndicators
          chartData={chartData}
          showRSI={showIndicators.rsi}
          showMACD={showIndicators.macd}
          showVolume={hasVolumeData}
        />
      </CardContent>
    </Card>
  );
}