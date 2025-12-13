import { useState } from 'react';
import PriceChart from './charts/PriceChart';
import OrderbookPanel from './charts/OrderbookPanel';
import TradesPanel from './charts/TradesPanel';
import ManualTradingSettings from './charts/ManualTradingSettings';
import { BotLogEntry } from './BotsLogsPanel';

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

interface PositionLevel {
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  side: 'LONG' | 'SHORT';
}

interface DashboardChartsProps {
  priceData: Array<PriceDataPoint>;
  positions: Position[];
  closedTrades: ClosedTrade[];
  selectedSymbol: string;
  onTimeframeChange: (timeframe: string) => void;
  orderbook?: Array<{price: number, bidSize: number, askSize: number}>;
  strategySignals?: Array<{strategy: string, signal: 'buy' | 'sell' | 'neutral', strength: number, reason: string}>;
  accountMode: 'live' | 'demo';
  apiMode: 'live' | 'testnet';
  positionLevels?: PositionLevel[];
  onSymbolChange?: (symbol: string) => void;
}

export default function DashboardCharts({ 
  priceData, 
  positions, 
  closedTrades,
  selectedSymbol, 
  onTimeframeChange, 
  orderbook = [], 
  strategySignals = [],
  accountMode,
  apiMode,
  positionLevels = [],
  onSymbolChange
}: DashboardChartsProps) {
  const [botLogs, setBotLogs] = useState<BotLogEntry[]>([]);
  const [activeBotCount, setActiveBotCount] = useState(0);
  
  const handleLogAdd = (log: BotLogEntry) => {
    setBotLogs(prev => [log, ...prev].slice(0, 100));
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <PriceChart 
            priceData={priceData}
            selectedSymbol={selectedSymbol}
            onTimeframeChange={onTimeframeChange}
            strategySignals={strategySignals}
            positionLevels={positionLevels}
          />
          
          <TradesPanel 
            positions={positions} 
            closedTrades={closedTrades} 
            strategySignals={strategySignals}
            botLogs={botLogs}
            onLogAdd={handleLogAdd}
            activeBotCount={activeBotCount}
            onBotCountChange={setActiveBotCount}
            onBotClick={onSymbolChange}
          />
        </div>
        
        <div className="space-y-6">
          <OrderbookPanel orderbook={orderbook} symbol={selectedSymbol.replace('/', '')} />
          <ManualTradingSettings accountMode={accountMode} apiMode={apiMode} />
        </div>
      </div>
    </div>
  );
}