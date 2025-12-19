import { useState, useEffect } from 'react';

const FUNCTION_URL = 'https://functions.poehali.dev/9df677d4-5f06-4a52-b9bd-85ad44e095a3';

export interface MACrossoverSignal {
  index: number;
  type: 'BUY' | 'SELL';
  price: number;
  ema9: number;
  ema21: number;
  rsi: number;
  timestamp: string;
}

export interface MACrossoverData {
  signals: MACrossoverSignal[];
  indicators: {
    ema9: number[];
    ema21: number[];
    rsi: number[];
  };
}

export function useMACrossoverSignals(
  priceData: Array<{close?: number; price: number}>,
  symbol: string,
  enabled: boolean = true
) {
  const [data, setData] = useState<MACrossoverData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !priceData || priceData.length < 30) {
      return;
    }

    const fetchSignals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const prices = priceData.map(d => d.close || d.price);

        const response = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': localStorage.getItem('user_id') || '1'
          },
          body: JSON.stringify({
            symbol: symbol,
            prices: prices
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setData({
            signals: result.signals || [],
            indicators: result.indicators || { ema9: [], ema21: [], rsi: [] }
          });
        } else {
          throw new Error(result.error || 'Failed to fetch signals');
        }
      } catch (err) {
        console.error('MA Crossover error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignals();

    // Refresh every 30 seconds
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, [priceData, symbol, enabled]);

  return { data, isLoading, error };
}
