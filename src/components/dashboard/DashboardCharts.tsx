import { useState } from 'react';
import PriceChart from './charts/PriceChart';
import OrderbookPanel from './charts/OrderbookPanel';
import TradesPanel from './charts/TradesPanel';
import ManualTradingSettings from './charts/ManualTradingSettings';
import StrategySignalsPanel from './charts/StrategySignalsPanel';
import CollapsiblePanel from './charts/CollapsiblePanel';
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
  spotData?: Array<PriceDataPoint>;
  futuresData?: Array<PriceDataPoint>;
  positions: Position[];
  closedTrades: ClosedTrade[];
  selectedSymbol: string;
  onTimeframeChange: (timeframe: string) => void;
  onMarketTypeChange?: (type: 'spot' | 'futures' | 'overlay') => void;
  orderbook?: Array<{price: number, bidSize: number, askSize: number}>;
  strategySignals?: Array<{strategy: string, signal: 'buy' | 'sell' | 'neutral', strength: number, reason: string}>;
  accountMode: 'live' | 'demo';
  apiMode: 'live' | 'testnet';
  positionLevels?: PositionLevel[];
  onSymbolChange?: (symbol: string) => void;
  userPositions?: Array<{symbol: string; side: string; entryPrice: number; unrealizedPnl: number}>;
  userId: number;
  availableBalance?: number;
}

export default function DashboardCharts({ 
  priceData, 
  spotData = [],
  futuresData = [],
  positions, 
  closedTrades,
  selectedSymbol, 
  onTimeframeChange,
  onMarketTypeChange, 
  orderbook = [], 
  strategySignals = [],
  accountMode,
  apiMode,
  positionLevels = [],
  onSymbolChange,
  userPositions,
  userId,
  availableBalance = 0
}: DashboardChartsProps) {
  const [botLogs, setBotLogs] = useState<BotLogEntry[]>([]);
  const [activeBotCount, setActiveBotCount] = useState(0);
  const [panelOrder, setPanelOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('rightPanelOrder');
    return saved ? JSON.parse(saved) : ['orderbook', 'signals', 'trading'];
  });
  const [draggedPanel, setDraggedPanel] = useState<string | null>(null);
  
  const handleLogAdd = (log: BotLogEntry) => {
    setBotLogs(prev => [log, ...prev].slice(0, 100));
  };

  const handleDragStart = (panelId: string) => (e: React.DragEvent) => {
    setDraggedPanel(panelId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetPanelId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedPanel || draggedPanel === targetPanelId) return;

    const newOrder = [...panelOrder];
    const draggedIndex = newOrder.indexOf(draggedPanel);
    const targetIndex = newOrder.indexOf(targetPanelId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedPanel);

    setPanelOrder(newOrder);
    localStorage.setItem('rightPanelOrder', JSON.stringify(newOrder));
    setDraggedPanel(null);
  };

  const panelComponents = {
    orderbook: (
      <CollapsiblePanel
        key="orderbook"
        title="Стакан ордеров"
        icon="BookOpen"
        badge="0.01"
        defaultOpen={true}
        draggable={true}
        onDragStart={handleDragStart('orderbook')}
        onDragOver={handleDragOver}
        onDrop={handleDrop('orderbook')}
      >
        <OrderbookPanel orderbook={orderbook} symbol={selectedSymbol.replace('/', '')} />
      </CollapsiblePanel>
    ),
    signals: (
      <CollapsiblePanel
        key="signals"
        title="Сигналы стратегий"
        icon="TrendingUp"
        defaultOpen={true}
        draggable={true}
        onDragStart={handleDragStart('signals')}
        onDragOver={handleDragOver}
        onDrop={handleDrop('signals')}
      >
        <StrategySignalsPanel strategySignals={strategySignals} />
      </CollapsiblePanel>
    ),
    trading: (
      <CollapsiblePanel
        key="trading"
        title="Ручная торговля"
        icon="DollarSign"
        defaultOpen={false}
        draggable={true}
        onDragStart={handleDragStart('trading')}
        onDragOver={handleDragOver}
        onDrop={handleDrop('trading')}
      >
        <ManualTradingSettings accountMode={accountMode} apiMode={apiMode} symbol={selectedSymbol.replace('/', '')} availableBalance={availableBalance} />
      </CollapsiblePanel>
    ),
  };

  // Get current market price from orderbook
  const asks = orderbook.filter(o => o.askSize > 0).sort((a, b) => a.price - b.price);
  const bids = orderbook.filter(o => o.bidSize > 0).sort((a, b) => b.price - a.price);
  const currentMarketPrice = asks.length > 0 && bids.length > 0 
    ? (asks[0].price + bids[0].price) / 2 
    : undefined;
  const bestAsk = asks.length > 0 ? asks[0].price : undefined;
  const bestBid = bids.length > 0 ? bids[0].price : undefined;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <PriceChart 
            priceData={priceData}
            spotData={spotData}
            futuresData={futuresData}
            selectedSymbol={selectedSymbol}
            onTimeframeChange={onTimeframeChange}
            onMarketTypeChange={onMarketTypeChange}
            strategySignals={strategySignals}
            positionLevels={positionLevels}
            currentMarketPrice={currentMarketPrice}
            bestAsk={bestAsk}
            bestBid={bestBid}
            orderbook={orderbook}
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
            userPositions={userPositions}
            accountMode={accountMode}
            userId={userId}
          />
        </div>
        
        <div className="space-y-4">
          {panelOrder.map(panelId => panelComponents[panelId as keyof typeof panelComponents])}
        </div>
      </div>
    </div>
  );
}