import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { sendTelegramNotification, getUserBots, createBot, updateBot, deleteBot } from '@/lib/api';
import { BotLogEntry } from '../BotsLogsPanel';

export interface Bot {
  id: string;
  pair: string;
  market: 'spot' | 'futures';
  strategy: string;
  status: 'searching' | 'in_position' | 'stopped';
  active: boolean;
  entrySignal?: string;
  currentPnL?: number;
  entryPrice?: number;
}

interface UseBotsManagerProps {
  userId: number;
  userPositions: Array<{symbol: string; side: string; entryPrice: number; unrealizedPnl: number; currentPrice?: number; size?: number; leverage?: number}>;
  accountMode: 'live' | 'demo';
  onLogAdd: (log: BotLogEntry) => void;
  onBotCountChange?: (count: number) => void;
}

export function useBotsManager({ userId, userPositions, accountMode, onLogAdd, onBotCountChange }: UseBotsManagerProps) {
  const { toast } = useToast();
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load bots on mount
  useEffect(() => {
    const loadBots = async () => {
      try {
        const loadedBots = await getUserBots(userId);
        setBots(loadedBots.map(b => ({
          ...b,
          status: b.active ? 'searching' as const : 'stopped' as const
        })));
      } catch (error) {
        console.error('Failed to load bots:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBots();
  }, [userId]);

  // Sync bots with user positions
  useEffect(() => {
    const updatedBots = bots.map(bot => {
      const pairSymbol = bot.pair.replace('/', '');
      const position = userPositions.find(p => p.symbol === pairSymbol);
      
      const wasSearching = bot.status === 'searching';
      const wasInPosition = bot.status === 'in_position';
      
      if (position && bot.active) {
        if (wasSearching) {
          sendTelegramNotification({
            type: 'position_entry',
            symbol: pairSymbol,
            side: position.side,
            market: bot.market,
            mode: accountMode,
            entryPrice: position.entryPrice,
            size: position.size,
            leverage: position.leverage
          }).catch(err => console.error('Failed to send Telegram notification:', err));
          
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          onLogAdd({
            id: Date.now().toString() + Math.random(),
            botId: bot.id,
            botName: `${bot.pair} (${bot.strategy})`,
            timestamp: timeStr,
            type: 'entry',
            message: `Открыта позиция ${position.side}`,
            details: {
              price: position.entryPrice
            }
          });
        }
        
        return {
          ...bot,
          status: 'in_position' as const,
          entryPrice: position.entryPrice,
          currentPnL: position.unrealizedPnl
        };
      } else if (bot.active) {
        if (wasInPosition && bot.entryPrice) {
          const exitPrice = userPositions.find(p => p.symbol === pairSymbol)?.currentPrice || 0;
          const pnl = bot.currentPnL || 0;
          const pnlPercent = bot.entryPrice > 0 ? (pnl / bot.entryPrice) * 100 : 0;
          
          sendTelegramNotification({
            type: 'position_exit',
            symbol: pairSymbol,
            side: bot.entrySignal || 'LONG',
            mode: accountMode,
            entryPrice: bot.entryPrice,
            exitPrice: exitPrice,
            pnl: pnl,
            pnlPercent: pnlPercent,
            reason: 'Закрытие позиции'
          }).catch(err => console.error('Failed to send exit notification:', err));
          
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          onLogAdd({
            id: Date.now().toString() + Math.random(),
            botId: bot.id,
            botName: `${bot.pair} (${bot.strategy})`,
            timestamp: timeStr,
            type: 'exit',
            message: `Закрыта позиция с PnL ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT`,
            details: {
              pnl: pnl,
              pnlPercent: pnlPercent
            }
          });
        }
        
        return {
          ...bot,
          status: 'searching' as const,
          entryPrice: undefined,
          currentPnL: undefined
        };
      }
      
      return bot;
    });
    
    const hasChanges = JSON.stringify(updatedBots) !== JSON.stringify(bots);
    if (hasChanges) {
      setBots(updatedBots);
    }
    
    const activeCount = updatedBots.filter(b => b.active).length;
    onBotCountChange?.(activeCount);
  }, [userPositions, bots, onBotCountChange, accountMode, onLogAdd]);

  const toggleBot = async (id: string) => {
    const bot = bots.find(b => b.id === id);
    if (!bot) return;
    
    const newActive = !bot.active;
    
    try {
      await updateBot(userId, id, newActive);
      
      setBots(prev => {
        const updated = prev.map(b => {
          if (b.id === id) {
            const newStatus = newActive ? 'searching' as const : 'stopped' as const;
            
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            
            onLogAdd({
              id: Date.now().toString(),
              botId: b.id,
              botName: `${b.pair} (${b.strategy})`,
              timestamp: timeStr,
              type: 'info',
              message: newActive ? 'Бот запущен и начал поиск точки входа' : 'Бот остановлен'
            });
            
            return { ...b, active: newActive, status: newStatus };
          }
          return b;
        });
        const activeCount = updated.filter(b => b.active).length;
        onBotCountChange?.(activeCount);
        return updated;
      });
    } catch (error) {
      console.error('Failed to toggle bot:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус бота',
        variant: 'destructive'
      });
    }
  };

  const addBot = async (botData: Bot) => {
    try {
      await createBot(userId, botData);
      
      setBots(prev => {
        const updated = [...prev, botData];
        const activeCount = updated.filter(b => b.active).length;
        onBotCountChange?.(activeCount);
        return updated;
      });
      
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      onLogAdd({
        id: Date.now().toString(),
        botId: botData.id,
        botName: `${botData.pair} (${botData.strategy})`,
        timestamp: timeStr,
        type: 'info',
        message: `Бот создан и запущен на ${botData.market === 'spot' ? 'споте' : 'фьючерсах'}`
      });

      toast({
        title: '✅ Бот создан',
        description: `${botData.pair} (${botData.strategy})`
      });
    } catch (error) {
      console.error('Failed to create bot:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать бота',
        variant: 'destructive'
      });
    }
  };

  const removeBot = async (id: string) => {
    const bot = bots.find(b => b.id === id);
    if (!bot) return;
    
    try {
      await deleteBot(userId, id);
      
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      onLogAdd({
        id: Date.now().toString(),
        botId: bot.id,
        botName: `${bot.pair} (${bot.strategy})`,
        timestamp: timeStr,
        type: 'info',
        message: 'Бот удалён'
      });
      
      setBots(prev => {
        const updated = prev.filter(b => b.id !== id);
        const activeCount = updated.filter(b => b.active).length;
        onBotCountChange?.(activeCount);
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete bot:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить бота',
        variant: 'destructive'
      });
    }
  };

  return {
    bots,
    isLoading,
    toggleBot,
    addBot,
    removeBot
  };
}
