import PriceChart from './charts/PriceChart';
import OrderbookPanel from './charts/OrderbookPanel';
import TradesPanel from './charts/TradesPanel';

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

interface ClosedTrade {
  id: number;
  pair: string;
  side: string;
  entry: number;
  exit: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  closeTime: string;
}

interface DashboardChartsProps {
  priceData: Array<PriceDataPoint>;
  positions: Position[];
  closedTrades: ClosedTrade[];
  selectedSymbol: string;
  onTimeframeChange: (timeframe: string) => void;
  orderbook?: Array<{price: number, bidSize: number, askSize: number}>;
  strategySignals?: Array<{strategy: string, signal: 'buy' | 'sell' | 'neutral', strength: number, reason: string}>;
}

export default function DashboardCharts({ 
  priceData, 
  positions, 
  closedTrades,
  selectedSymbol, 
  onTimeframeChange, 
  orderbook = [], 
  strategySignals = [] 
}: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3">
          <PriceChart 
            priceData={priceData}
            selectedSymbol={selectedSymbol}
            onTimeframeChange={onTimeframeChange}
            strategySignals={strategySignals}
          />
        </div>
        <div className="col-span-1">
          <OrderbookPanel orderbook={orderbook} symbol={selectedSymbol.replace('/', '')} />
        </div>
      </div>

      <TradesPanel positions={positions} closedTrades={closedTrades} strategySignals={strategySignals} />
    </div>
  );
}