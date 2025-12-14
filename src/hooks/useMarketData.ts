import { useState, useEffect } from 'react';
import { getMarketTickers } from '@/lib/api';

const defaultWatchlist = [
  { symbol: 'BTCUSDT', price: 43580, change: 2.34, volume: '2.4B', signal: 'buy' },
  { symbol: 'ETHUSDT', price: 2265, change: -0.87, volume: '1.2B', signal: 'neutral' },
  { symbol: 'SOLUSDT', price: 101.2, change: 5.12, volume: '340M', signal: 'buy' },
  { symbol: 'BNBUSDT', price: 312.5, change: 1.23, volume: '180M', signal: 'sell' },
  { symbol: 'XRPUSDT', price: 0.495, change: -2.15, volume: '890M', signal: 'neutral' },
];

export interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  volume: string;
  signal: string;
}

export interface LogEntry {
  time: string;
  type: string;
  message: string;
}

export function useMarketData() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem('user_watchlist');
    return saved ? JSON.parse(saved) : defaultWatchlist;
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    localStorage.setItem('user_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const symbols = watchlist.map(w => w.symbol);
        const tickers = await getMarketTickers(symbols);
        
        const updatedWatchlist = watchlist.map(item => {
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
    const marketInterval = setInterval(loadMarketData, 30000);
    return () => clearInterval(marketInterval);
  }, [watchlist]);

  const handleAddPair = (symbol: string) => {
    if (watchlist.some(w => w.symbol === symbol)) {
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLogs(prev => [{
        time: timeStr,
        type: 'warning',
        message: `Пара ${symbol} уже добавлена в список`
      }, ...prev].slice(0, 50));
      return;
    }

    setWatchlist(prev => [...prev, {
      symbol,
      price: 0,
      change: 0,
      volume: '0',
      signal: 'neutral'
    }]);

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [{
      time: timeStr,
      type: 'success',
      message: `Добавлена пара ${symbol.replace('USDT', '/USDT')}`
    }, ...prev].slice(0, 50));
  };

  const handleRemovePair = (symbol: string, selectedSymbol: string, onSymbolChange: (symbol: string) => void) => {
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    
    if (selectedSymbol === symbol && watchlist.length > 1) {
      const remaining = watchlist.filter(w => w.symbol !== symbol);
      onSymbolChange(remaining[0].symbol);
    }

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [{
      time: timeStr,
      type: 'info',
      message: `Удалена пара ${symbol.replace('USDT', '/USDT')}`
    }, ...prev].slice(0, 50));
  };

  return {
    watchlist,
    logs,
    handleAddPair,
    handleRemovePair
  };
}