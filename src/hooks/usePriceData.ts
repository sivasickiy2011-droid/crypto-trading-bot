import { useState, useEffect } from 'react';
import { getKlineData } from '@/lib/api';
import { WatchlistItem } from './useMarketData';

const generateMockPriceData = (basePrice: number) => Array.from({ length: 50 }, (_, i) => ({
  time: `${9 + Math.floor(i / 12)}:${(i % 12) * 5}`.padEnd(5, '0'),
  price: basePrice + Math.random() * (basePrice * 0.05) - (basePrice * 0.025),
  ma20: basePrice + Math.sin(i / 10) * (basePrice * 0.01),
  ma50: basePrice + Math.cos(i / 15) * (basePrice * 0.008),
  signal: i % 15 === 0 ? (i % 30 === 0 ? 'buy' : 'sell') : null
}));

export interface PriceDataPoint {
  time: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  ma20: number;
  ma50: number;
  ema9?: number;
  ema21?: number;
  ema50?: number;
  rsi?: number;
  bbUpper?: number;
  bbLower?: number;
  macd?: number;
  signal: string | null;
  spotClose?: number;
  futuresClose?: number;
}

const calculateMA = (prices: number[], period: number): number[] => {
  const ma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      const slice = prices.slice(0, i + 1);
      ma.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      ma.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
  }
  return ma;
};

const calculateEMA = (prices: number[], period: number): number[] => {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  ema[0] = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  return ema;
};

const calculateRSI = (prices: number[], period: number = 14): number[] => {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push(50);
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
  }
  return [50, ...rsi];
};

const calculateBB = (prices: number[], period: number = 20): { upper: number[]; lower: number[] } => {
  const middle = calculateMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(prices[i] * 1.02);
      lower.push(prices[i] * 0.98);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + 2 * std);
      lower.push(mean - 2 * std);
    }
  }
  return { upper, lower };
};

const calculateMACD = (prices: number[]): number[] => {
  const emaFast = calculateEMA(prices, 12);
  const emaSlow = calculateEMA(prices, 26);
  const macd = emaFast.map((val, i) => val - emaSlow[i]);
  const signal = calculateEMA(macd, 9);
  return macd.map((val, i) => val - signal[i]);
};

export function usePriceData(
  selectedSymbol: string, 
  watchlist: WatchlistItem[], 
  currentTimeframe: string,
  enabled: boolean = true,
  marketType: 'spot' | 'futures' = 'futures'
) {
  const [priceData, setPriceData] = useState<PriceDataPoint[]>(generateMockPriceData(43580));
  const [spotData, setSpotData] = useState<PriceDataPoint[]>([]);
  const [futuresData, setFuturesData] = useState<PriceDataPoint[]>([]);

  useEffect(() => {
    if (!enabled || !selectedSymbol) {
      return;
    }

    const processKlineData = (klines: any[]) => {
      const closes = klines.map(k => k.close);
      const ema9 = calculateEMA(closes, 9);
      const ema21 = calculateEMA(closes, 21);
      const ema50 = calculateEMA(closes, 50);
      const rsi = calculateRSI(closes, 14);
      const bb = calculateBB(closes, 20);
      const macdHist = calculateMACD(closes);
      
      return klines.map((k, i) => {
        const date = new Date(parseInt(k.time));
        return {
          time: `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`,
          price: k.close,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
          volume: k.volume,
          ma20: calculateMA(closes, 20)[i],
          ma50: calculateMA(closes, 50)[i],
          ema9: ema9[i],
          ema21: ema21[i],
          ema50: ema50[i],
          rsi: rsi[i],
          bbUpper: bb.upper[i],
          bbLower: bb.lower[i],
          macd: macdHist[i],
          signal: null
        };
      });
    };

    const loadPriceData = async () => {
      try {
        if (marketType === 'spot') {
          const klines = await getKlineData(selectedSymbol, currentTimeframe, 50, 'spot');
          if (klines.length > 0) {
            const formatted = processKlineData(klines);
            setPriceData(formatted);
            setSpotData(formatted);
          }
        } else if (marketType === 'futures') {
          const klines = await getKlineData(selectedSymbol, currentTimeframe, 50, 'linear');
          if (klines.length > 0) {
            const formatted = processKlineData(klines);
            setPriceData(formatted);
            setFuturesData(formatted);
          }
        } else if (marketType === 'overlay') {
          // overlay mode - load both
          const [spotKlines, futuresKlines] = await Promise.all([
            getKlineData(selectedSymbol, currentTimeframe, 50, 'spot'),
            getKlineData(selectedSymbol, currentTimeframe, 50, 'linear')
          ]);
          
          if (spotKlines.length > 0 && futuresKlines.length > 0) {
            const spotFormatted = processKlineData(spotKlines);
            const futuresFormatted = processKlineData(futuresKlines);
            
            // Merge data for overlay - use futures as base, add spot prices
            const mergedData = futuresFormatted.map((point, i) => ({
              ...point,
              spotClose: spotFormatted[i]?.close || point.close,
              futuresClose: point.close
            }));
            
            setPriceData(mergedData);
            setSpotData(spotFormatted);
            setFuturesData(futuresFormatted);
          }
        }
      } catch (error) {
        const selectedItem = watchlist.find(w => w.symbol === selectedSymbol);
        setPriceData(generateMockPriceData(selectedItem?.price || 43580));
      }
    };

    loadPriceData();
    const priceInterval = setInterval(loadPriceData, 30000);
    return () => clearInterval(priceInterval);
  }, [selectedSymbol, watchlist, currentTimeframe, enabled, marketType]);

  return { priceData, spotData, futuresData };
}