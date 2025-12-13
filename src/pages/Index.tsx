import { useState, useEffect } from 'react';
import StrategyConfigModal from '@/components/StrategyConfigModal';
import BacktestPanel from '@/components/BacktestPanel';
import ApiKeysModal from '@/components/ApiKeysModal';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import DashboardSidePanels from '@/components/dashboard/DashboardSidePanels';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { getUserBalance, getUserPositions, UserBalanceData, UserPositionData, getMarketTickers, getKlineData, TickerData, KlineData } from '@/lib/api';

const generateMockPriceData = (basePrice: number) => Array.from({ length: 50 }, (_, i) => ({
  time: `${9 + Math.floor(i / 12)}:${(i % 12) * 5}`.padEnd(5, '0'),
  price: basePrice + Math.random() * (basePrice * 0.05) - (basePrice * 0.025),
  ma20: basePrice + Math.sin(i / 10) * (basePrice * 0.01),
  ma50: basePrice + Math.cos(i / 15) * (basePrice * 0.008),
  signal: i % 15 === 0 ? (i % 30 === 0 ? 'buy' : 'sell') : null
}));

const mockClosedTrades = [
  { id: 4, pair: 'BTC/USDT', side: 'LONG', entry: 42800, exit: 43200, size: 0.3, pnl: 120, pnlPercent: 5.6, closeTime: '11:23' },
  { id: 5, pair: 'ETH/USDT', side: 'SHORT', entry: 2310, exit: 2290, size: 1.5, pnl: 30, pnlPercent: 1.3, closeTime: '10:45' },
  { id: 6, pair: 'XRP/USDT', side: 'LONG', entry: 0.52, exit: 0.495, size: 1000, pnl: -25, pnlPercent: -4.8, closeTime: '09:15' },
];

const defaultWatchlist = [
  { symbol: 'BTCUSDT', price: 43580, change: 2.34, volume: '2.4B', signal: 'buy' },
  { symbol: 'ETHUSDT', price: 2265, change: -0.87, volume: '1.2B', signal: 'neutral' },
  { symbol: 'SOLUSDT', price: 101.2, change: 5.12, volume: '340M', signal: 'buy' },
  { symbol: 'BNBUSDT', price: 312.5, change: 1.23, volume: '180M', signal: 'sell' },
  { symbol: 'XRPUSDT', price: 0.495, change: -2.15, volume: '890M', signal: 'neutral' },
];



interface IndexProps {
  userId: number;
  username: string;
  onLogout: () => void;
}

export default function Index({ userId, username, onLogout }: IndexProps) {
  const [botStatus, setBotStatus] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState('ma-crossover');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [apiKeysModalOpen, setApiKeysModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  
  const [balance, setBalance] = useState<UserBalanceData | null>(null);
  const [positions, setPositions] = useState<UserPositionData[]>([]);
  const [watchlist, setWatchlist] = useState(defaultWatchlist);
  const [priceData, setPriceData] = useState(generateMockPriceData(43580));
  const [logs, setLogs] = useState<Array<{time: string, type: string, message: string}>>([]);

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const symbols = defaultWatchlist.map(w => w.symbol);
        const tickers = await getMarketTickers(symbols);
        
        const updatedWatchlist = defaultWatchlist.map(item => {
          const ticker = tickers.find(t => t.symbol === item.symbol);
          return ticker ? {
            ...item,
            price: ticker.price,
            change: ticker.change,
            volume: ticker.volume,
            signal: ticker.change > 2 ? 'buy' : ticker.change < -2 ? 'sell' : 'neutral'
          } : item;
        });
        
        setWatchlist(updatedWatchlist);
        
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setLogs(prev => [{
          time: timeStr,
          type: 'info',
          message: `Обновлены рыночные данные для ${tickers.length} пар`
        }, ...prev].slice(0, 50));
      } catch (error) {
        console.error('Failed to load market data:', error);
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setLogs(prev => [{
          time: timeStr,
          type: 'error',
          message: 'Ошибка загрузки рыночных данных'
        }, ...prev].slice(0, 50));
      }
    };

    loadMarketData();
    const marketInterval = setInterval(loadMarketData, 10000);
    return () => clearInterval(marketInterval);
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [balanceData, positionsData] = await Promise.all([
          getUserBalance(userId).catch(() => null),
          getUserPositions(userId).catch(() => [])
        ]);
        setBalance(balanceData);
        setPositions(positionsData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
    const userDataInterval = setInterval(loadUserData, 30000);
    return () => clearInterval(userDataInterval);
  }, [userId]);

  useEffect(() => {
    const loadPriceData = async () => {
      try {
        const klines = await getKlineData(selectedSymbol, '15', 50);
        
        if (klines.length > 0) {
          const formattedData = klines.map((k, i) => {
            const date = new Date(parseInt(k.time));
            return {
              time: `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`,
              price: k.close,
              ma20: k.close,
              ma50: k.close,
              signal: null
            };
          });
          setPriceData(formattedData);
        }
      } catch (error) {
        const selectedItem = watchlist.find(w => w.symbol === selectedSymbol);
        setPriceData(generateMockPriceData(selectedItem?.price || 43580));
      }
    };

    loadPriceData();
    const priceInterval = setInterval(loadPriceData, 15000);
    return () => clearInterval(priceInterval);
  }, [selectedSymbol, watchlist]);

  const totalPnL = positions.length > 0 
    ? positions.reduce((sum, p) => sum + p.unrealizedPnl, 0) 
    : 0;
  
  const totalPnLPercent = balance && balance.totalEquity > 0
    ? (totalPnL / balance.totalEquity) * 100 
    : 0;
  
  const displayPositions = positions.map((p, idx) => ({
    id: idx + 1,
    pair: p.symbol,
    side: p.side,
    entry: p.entryPrice,
    current: p.currentPrice,
    size: p.size,
    leverage: p.leverage,
    pnl: p.unrealizedPnl,
    pnlPercent: p.pnlPercent,
    status: 'active'
  }));
  
  const formatSymbolForDisplay = (symbol: string) => {
    return symbol.replace('USDT', '/USDT');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onConfigOpen={() => setConfigModalOpen(true)}
          onApiKeysOpen={() => setApiKeysModalOpen(true)}
          onLogout={onLogout}
        />

        <StrategyConfigModal 
          open={configModalOpen} 
          onOpenChange={setConfigModalOpen}
          userId={userId}
        />
        
        <ApiKeysModal
          open={apiKeysModalOpen}
          onOpenChange={setApiKeysModalOpen}
          userId={userId}
        />

        <main className="flex-1">
          <DashboardHeader
            botStatus={botStatus}
            onBotStatusChange={setBotStatus}
            username={username}
            userId={userId}
          />

          <div className="p-6 space-y-6">
            {activeTab === 'backtest' ? (
              <BacktestPanel />
            ) : (
              <>
                <DashboardMetrics
                  totalPnL={totalPnL}
                  totalPnLPercent={totalPnLPercent}
                  openPositions={displayPositions.length}
                  balance={balance}
                />

                <div className="grid grid-cols-3 gap-6">
                  <DashboardCharts
                    priceData={priceData}
                    positions={displayPositions}
                    selectedSymbol={formatSymbolForDisplay(selectedSymbol)}
                  />

                  <DashboardSidePanels
                    watchlist={watchlist}
                    selectedStrategy={selectedStrategy}
                    onStrategyChange={setSelectedStrategy}
                    onConfigOpen={() => setConfigModalOpen(true)}
                    onSymbolSelect={setSelectedSymbol}
                    selectedSymbol={selectedSymbol}
                  />
                </div>

                <DashboardTabs
                  closedTrades={mockClosedTrades}
                  logs={logs}
                  watchlist={watchlist}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}