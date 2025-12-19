import { useState } from 'react';
import { BotLogEntry } from './BotsLogsPanel';
import MACrossoverStrategyModal, { StrategyConfig } from '@/components/MACrossoverStrategyModal';
import BotsPanelHeader from './bots/BotsPanelHeader';
import BotsList from './bots/BotsList';
import CreateBotDialog from './bots/CreateBotDialog';
import { useBotsManager, Bot } from './bots/useBotsManager';

interface BotsPanelProps {
  onLogAdd: (log: BotLogEntry) => void;
  onBotCountChange?: (count: number) => void;
  onBotClick?: (pair: string) => void;
  userPositions?: Array<{symbol: string; side: string; entryPrice: number; unrealizedPnl: number}>;
  accountMode?: 'live' | 'demo';
  userId: number;
}

export default function BotsPanel({ onLogAdd, onBotCountChange, onBotClick, userPositions = [], accountMode = 'demo', userId }: BotsPanelProps) {
  const [newBotOpen, setNewBotOpen] = useState(false);
  const [maCrossoverModalOpen, setMaCrossoverModalOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');

  const { bots, isLoading, toggleBot, addBot, removeBot } = useBotsManager({
    userId,
    userPositions,
    accountMode,
    onLogAdd,
    onBotCountChange
  });

  const handleMACrossoverStart = async (config: StrategyConfig) => {
    const newBotData: Bot = {
      id: Date.now().toString(),
      pair: config.symbol.replace('USDT', '/USDT'),
      market: 'futures',
      strategy: `MA Crossover (${config.orderType === 'single' ? 'Одиночная' : 'Сетка'})`,
      status: 'searching',
      active: true
    };

    await addBot(newBotData);
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    onLogAdd({
      id: Date.now().toString(),
      botId: newBotData.id,
      botName: `${newBotData.pair} (${newBotData.strategy})`,
      timestamp: timeStr,
      type: 'info',
      message: `Запущена стратегия MA Crossover: ${config.side} ${config.quantity} USDT × ${config.leverage}x`
    });
  };

  return (
    <div className="space-y-4">
      <BotsPanelHeader 
        bots={bots}
        onMACrossoverClick={() => setMaCrossoverModalOpen(true)}
        onCreateBotClick={() => setNewBotOpen(true)}
      />
      
      <BotsList 
        bots={bots}
        onToggleBot={toggleBot}
        onRemoveBot={removeBot}
        onBotClick={onBotClick}
      />

      <CreateBotDialog
        open={newBotOpen}
        onClose={() => setNewBotOpen(false)}
        onCreateBot={addBot}
      />

      <MACrossoverStrategyModal
        open={maCrossoverModalOpen}
        onClose={() => setMaCrossoverModalOpen(false)}
        onStart={handleMACrossoverStart}
        symbol={selectedSymbol}
        userId={userId}
      />
    </div>
  );
}
