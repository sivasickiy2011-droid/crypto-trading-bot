import PriceChart from './charts/PriceChart';
import PositionsList from './charts/PositionsList';
import OrderbookPanel from './charts/OrderbookPanel';
import StrategySignalsPanel from './charts/StrategySignalsPanel';

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

export default function DashboardCharts({ 
  priceData, 
  positions, 
  selectedSymbol, 
  onTimeframeChange, 
  orderbook = [], 
  strategySignals = [] 
}: DashboardChartsProps) {
  return (
    <div className="col-span-2 space-y-6">
      <PriceChart 
        priceData={priceData}
        selectedSymbol={selectedSymbol}
        onTimeframeChange={onTimeframeChange}
        strategySignals={strategySignals}
      />

      <PositionsList positions={positions} />

      <div className="grid grid-cols-2 gap-6">
        <OrderbookPanel orderbook={orderbook} />
        <StrategySignalsPanel strategySignals={strategySignals} />
      </div>
    </div>
  );
}
