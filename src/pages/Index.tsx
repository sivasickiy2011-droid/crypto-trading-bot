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
import { getUserBalance, getUserPositions, UserBalanceData, UserPositionData } from '@/lib/api';

const mockPriceData = Array.from({ length: 50 }, (_, i) => ({
  time: `${9 + Math.floor(i / 12)}:${(i % 12) * 5}`.padEnd(5, '0'),
  price: 43000 + Math.random() * 2000 - 1000,
  ma20: 43200 + Math.sin(i / 10) * 500,
  ma50: 43100 + Math.cos(i / 15) * 400,
  signal: i % 15 === 0 ? (i % 30 === 0 ? 'buy' : 'sell') : null
}));

const mockPositions = [
  { id: 1, pair: 'BTC/USDT', side: 'LONG', entry: 43250, current: 43580, size: 0.5, leverage: 10, pnl: 165, pnlPercent: 7.62, status: 'active' },
  { id: 2, pair: 'ETH/USDT', side: 'SHORT', entry: 2280, current: 2265, size: 2, leverage: 5, pnl: 30, pnlPercent: 1.32, status: 'active' },
  { id: 3, pair: 'SOL/USDT', side: 'LONG', entry: 98.5, current: 101.2, size: 10, leverage: 3, pnl: 27, pnlPercent: 2.74, status: 'active' },
];

const mockClosedTrades = [
  { id: 4, pair: 'BTC/USDT', side: 'LONG', entry: 42800, exit: 43200, size: 0.3, pnl: 120, pnlPercent: 5.6, closeTime: '11:23' },
  { id: 5, pair: 'ETH/USDT', side: 'SHORT', entry: 2310, exit: 2290, size: 1.5, pnl: 30, pnlPercent: 1.3, closeTime: '10:45' },
  { id: 6, pair: 'XRP/USDT', side: 'LONG', entry: 0.52, exit: 0.495, size: 1000, pnl: -25, pnlPercent: -4.8, closeTime: '09:15' },
];

const mockWatchlist = [
  { symbol: 'BTC/USDT', price: 43580, change: 2.34, volume: '2.4B', signal: 'buy' },
  { symbol: 'ETH/USDT', price: 2265, change: -0.87, volume: '1.2B', signal: 'neutral' },
  { symbol: 'SOL/USDT', price: 101.2, change: 5.12, volume: '340M', signal: 'buy' },
  { symbol: 'BNB/USDT', price: 312.5, change: 1.23, volume: '180M', signal: 'sell' },
  { symbol: 'XRP/USDT', price: 0.495, change: -2.15, volume: '890M', signal: 'neutral' },
];

const mockLogs = [
  { time: '14:23:15', type: 'info', message: 'Обнаружен сигнал MA Crossover на BTC/USDT' },
  { time: '14:22:48', type: 'success', message: 'Открыта позиция: LONG BTC/USDT по 43250' },
  { time: '14:20:33', type: 'warning', message: 'Скорректирован стоп-лосс для позиции ETH/USDT' },
  { time: '14:18:12', type: 'info', message: 'Сработал Мартингейл уровень 2 на SOL/USDT' },
  { time: '14:15:45', type: 'error', message: 'Недостаточно средств для открытия позиции' },
  { time: '14:12:30', type: 'success', message: 'Закрыта позиция: SHORT ETH/USDT, PnL: +$30' },
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
  
  const [balance, setBalance] = useState<UserBalanceData | null>(null);
  const [positions, setPositions] = useState<UserPositionData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoadingData(true);
      try {
        const [balanceData, positionsData] = await Promise.all([
          getUserBalance(userId).catch(() => null),
          getUserPositions(userId).catch(() => [])
        ]);
        setBalance(balanceData);
        setPositions(positionsData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadUserData();
    const interval = setInterval(loadUserData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const totalPnL = positions.length > 0 
    ? positions.reduce((sum, p) => sum + p.unrealizedPnl, 0) 
    : mockPositions.reduce((sum, p) => sum + p.pnl, 0);
  
  const totalPnLPercent = balance 
    ? (totalPnL / balance.totalEquity) * 100 
    : (totalPnL / 10000) * 100;
  
  const displayPositions = positions.length > 0 
    ? positions.map((p, idx) => ({
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
      }))
    : mockPositions;

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
                    priceData={mockPriceData}
                    positions={displayPositions}
                  />

                  <DashboardSidePanels
                    watchlist={mockWatchlist}
                    selectedStrategy={selectedStrategy}
                    onStrategyChange={setSelectedStrategy}
                    onConfigOpen={() => setConfigModalOpen(true)}
                  />
                </div>

                <DashboardTabs
                  closedTrades={mockClosedTrades}
                  logs={mockLogs}
                  watchlist={mockWatchlist}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}