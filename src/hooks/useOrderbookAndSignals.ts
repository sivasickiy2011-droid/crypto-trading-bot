import { useState, useEffect, useRef } from 'react';
import { getOrderbook, getStrategySignals, OrderbookEntry, StrategySignal } from '@/lib/api';

export function useOrderbookAndSignals(
  selectedSymbol: string,
  apiMode: 'live' | 'testnet',
  signalsEnabled: boolean = true
) {
  const [orderbook, setOrderbook] = useState<OrderbookEntry[]>([]);
  const [strategySignals, setStrategySignals] = useState<StrategySignal[]>([]);
  const sentSignalsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clear signals when disabled or symbol changes
    if (!signalsEnabled) {
      setStrategySignals([]);
    }

    const loadOrderbookAndSignals = async () => {
      try {
        const orderbookData = await getOrderbook(selectedSymbol, 25).catch(() => []);
        setOrderbook(orderbookData);
        
        if (!signalsEnabled) {
          return;
        }
        
        const signalsData = await getStrategySignals(selectedSymbol).catch(() => []);
        
        if (signalsData && signalsData.length > 0) {
          signalsData.forEach(signal => {
            if (signal.signal !== 'neutral' && signal.strength > 60) {
              const signalKey = `${selectedSymbol}-${signal.strategy}-${signal.signal}-${Math.floor(Date.now() / 300000)}`;
              
              if (!sentSignalsRef.current.has(signalKey)) {
                sentSignalsRef.current.add(signalKey);
                
                const currentTime = Math.floor(Date.now() / 300000);
                sentSignalsRef.current.forEach(key => {
                  const keyTime = parseInt(key.split('-').pop() || '0');
                  if (currentTime - keyTime > 2) {
                    sentSignalsRef.current.delete(key);
                  }
                });
                
                import('@/lib/api').then(({ sendTelegramNotification }) => {
                  sendTelegramNotification({
                    type: 'signal',
                    symbol: selectedSymbol,
                    signal: signal.signal,
                    strength: signal.strength,
                    reason: signal.reason,
                    strategy: signal.strategy,
                    mode: apiMode === 'testnet' ? 'demo' : 'live'
                  }).catch(err => console.error('Failed to send signal notification:', err));
                });
              }
            }
          });
          setStrategySignals(signalsData);
        }
      } catch (error) {
        console.error('Failed to load orderbook or signals:', error);
      }
    };

    loadOrderbookAndSignals();
    const interval = setInterval(loadOrderbookAndSignals, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol, apiMode, signalsEnabled]);

  return { orderbook, strategySignals };
}