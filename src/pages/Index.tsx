import { useState, useEffect } from 'react';
import StrategyConfigModal from '@/components/StrategyConfigModal';
import BacktestPanel from '@/components/BacktestPanel';
import ApiKeysModal from '@/components/ApiKeysModal';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import DashboardWatchlist from '@/components/dashboard/DashboardWatchlist';
import DevConsole from '@/pages/DevConsole';

import { useMarketData } from '@/hooks/useMarketData';
import { useUserData } from '@/hooks/useUserData';
import { usePriceData } from '@/hooks/usePriceData';
import { useOrderbookAndSignals } from '@/hooks/useOrderbookAndSignals';
import { useApiRequestCounter } from '@/hooks/useApiRequestCounter';
import { createBot, getUserSettings, updateUserSettings, UserSettings } from '@/lib/api';
import { toast } from 'sonner';

const mockClosedTrades = [
  { id: 4, pair: 'BTC/USDT', side: 'LONG', entry: 42800, exit: 43200, size: 0.3, pnl: 120, pnlPercent: 5.6, closeTime: '11:23' },
  { id: 5, pair: 'ETH/USDT', side: 'SHORT', entry: 2310, exit: 2290, size: 1.5, pnl: 30, pnlPercent: 1.3, closeTime: '10:45' },
  { id: 6, pair: 'XRP/USDT', side: 'LONG', entry: 0.52, exit: 0.495, size: 1000, pnl: -25, pnlPercent: -4.8, closeTime: '09:15' },
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
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [currentTimeframe, setCurrentTimeframe] = useState('15');
  const [chartsEnabled, setChartsEnabled] = useState(true);
  const [signalsMode, setSignalsMode] = useState<'disabled' | 'bots_only' | 'top10'>('bots_only');
  const [apiRequestsEnabled, setApiRequestsEnabled] = useState(() => {
    const saved = localStorage.getItem('apiRequestsEnabled');
    return saved !== null ? saved === 'true' : false;
  });

  const { watchlist, logs, handleAddPair, handleRemovePair } = useMarketData(apiRequestsEnabled);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings(userId);
        setChartsEnabled(settings.charts_enabled);
        setSignalsMode(settings.signals_mode);
      } catch (error) {
        console.error('Failed to load user settings:', error);
      }
    };
    loadSettings();
  }, [userId]);

  // Set first symbol from watchlist as default
  useEffect(() => {
    if (!selectedSymbol && watchlist.length > 0) {
      setSelectedSymbol(watchlist[0].symbol);
    }
  }, [watchlist, selectedSymbol]);
  const { balance, positions } = useUserData(userId, 'live', apiRequestsEnabled);
  const { priceData } = usePriceData(selectedSymbol, watchlist, currentTimeframe, chartsEnabled && apiRequestsEnabled);
  const { orderbook, strategySignals } = useOrderbookAndSignals(selectedSymbol, 'live', signalsMode !== 'disabled' && apiRequestsEnabled);
  const { savedRequests } = useApiRequestCounter(chartsEnabled, signalsMode !== 'disabled');

  const handleChartsEnabledChange = async (enabled: boolean) => {
    setChartsEnabled(enabled);
    try {
      await updateUserSettings(userId, { charts_enabled: enabled });
      toast.success(enabled ? 'Графики включены' : 'Графики выключены');
    } catch (error) {
      toast.error('Не удалось сохранить настройку');
      console.error('Failed to update charts setting:', error);
    }
  };

  const handleSignalsModeChange = async (mode: 'disabled' | 'bots_only' | 'top10') => {
    setSignalsMode(mode);
    try {
      await updateUserSettings(userId, { signals_mode: mode });
      const modeText = mode === 'disabled' ? 'выключены' : mode === 'bots_only' ? 'только по ботам' : 'топ-10 рынка';
      toast.success(`Сигналы: ${modeText}`);
    } catch (error) {
      toast.error('Не удалось сохранить настройку');
      console.error('Failed to update signals mode:', error);
    }
  };

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

  const positionLevels = positions
    .filter(p => p.symbol === selectedSymbol)
    .map(p => ({
      entryPrice: p.entryPrice,
      stopLoss: p.side === 'LONG' ? p.entryPrice * 0.97 : p.entryPrice * 1.03,
      takeProfit: p.side === 'LONG' ? p.entryPrice * 1.05 : p.entryPrice * 0.95,
      side: p.side as 'LONG' | 'SHORT'
    }));

  const userPositionsForBots = positions.map(p => ({
    symbol: p.symbol,
    side: p.side,
    entryPrice: p.entryPrice,
    unrealizedPnl: p.unrealizedPnl
  }));
  
  const formatSymbolForDisplay = (symbol: string) => {
    return symbol.replace('USDT', '/USDT');
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'addToWatchlist') {
        handleAddPair(event.data.symbol);
        setSelectedSymbol(event.data.symbol);
        setActiveTab('dashboard');
        toast.success(`${event.data.symbol} добавлен в избранное`);
      }
      
      if (event.data.type === 'createBot') {
        try {
          await createBot(userId, {
            id: `bot-${Date.now()}`,
            pair: event.data.symbol.replace('USDT', '/USDT'),
            market: 'futures',
            strategy: 'EMA 9/21/55 (тренд + кросс)',
            active: true,
          });
          setActiveTab('dashboard');
          toast.success(`Бот для ${event.data.symbol} создан`);
        } catch (error) {
          toast.error('Ошибка создания бота');
        }
      }

      if (event.data.type === 'runAutoTrading') {
        try {
          const response = await fetch('https://function.centerai.tech/api/auto-trader-runner');
          const data = await response.json();
          if (data.success) {
            toast.success('Автотрейдинг запущен');
            setActiveTab('dashboard');
          }
        } catch (error) {
          toast.error('Ошибка запуска автотрейдинга');
        }
      }

      if (event.data.type === 'runBacktest') {
        setActiveTab('backtest');
        toast.success(`Переходим к бэктесту ${event.data.symbol}`);
      }

      if (event.data.type === 'askAssistant') {
        toast.info('Функция ассистента в разработке');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [userId, handleAddPair]);

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
            activeTab={activeTab}
            onTabChange={setActiveTab}
            chartsEnabled={chartsEnabled}
            onChartsEnabledChange={handleChartsEnabledChange}
            signalsMode={signalsMode}
            onSignalsModeChange={handleSignalsModeChange}
            savedRequests={savedRequests}
            apiRequestsEnabled={apiRequestsEnabled}
            onApiRequestsEnabledChange={(enabled) => {
              setApiRequestsEnabled(enabled);
              localStorage.setItem('apiRequestsEnabled', String(enabled));
            }}
          />

          <div className="p-6 space-y-6">
            {activeTab === 'backtest' ? (
              <BacktestPanel />
            ) : activeTab === 'top-pairs' ? (
              <div className="bg-background">
                <iframe 
                  src="/top-pairs" 
                  className="w-full h-[calc(100vh-120px)] border-0 rounded-lg"
                  title="Top Trading Pairs"
                />
              </div>
            ) : activeTab === 'dev-console' ? (
              <div className="mt-[-24px]">
                <DevConsole userId={userId} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                  <DashboardMetrics
                    totalPnL={totalPnL}
                    totalPnLPercent={totalPnLPercent}
                    openPositions={displayPositions.length}
                    balance={balance}
                    apiMode="live"
                    accountMode="live"
                  />

                  <DashboardWatchlist
                    watchlist={watchlist}
                    onSymbolSelect={setSelectedSymbol}
                    selectedSymbol={selectedSymbol}
                  />
                </div>

                <DashboardCharts
                  priceData={priceData}
                  positions={displayPositions}
                  closedTrades={mockClosedTrades}
                  selectedSymbol={formatSymbolForDisplay(selectedSymbol)}
                  onTimeframeChange={setCurrentTimeframe}
                  orderbook={orderbook}
                  strategySignals={strategySignals}
                  accountMode="live"
                  apiMode="live"
                  positionLevels={positionLevels}
                  onSymbolChange={setSelectedSymbol}
                  userPositions={userPositionsForBots}
                  userId={userId}
                />

                <DashboardTabs
                  closedTrades={mockClosedTrades}
                  logs={logs}
                  watchlist={watchlist}
                  onAddPair={handleAddPair}
                  onRemovePair={(symbol) => handleRemovePair(symbol, selectedSymbol, setSelectedSymbol)}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}