import { KlineData } from './api';

export interface BacktestTrade {
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  side: 'LONG' | 'SHORT';
  pnl: number;
  pnlPercent: number;
  reason: string;
}

export interface BacktestResults {
  trades: BacktestTrade[];
  totalPnL: number;
  totalPnLPercent: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  equityCurve: Array<{ time: string; equity: number; pnl: number }>;
  monthlyStats: Array<{ month: string; profit: number; loss: number; winRate: number; trades: number }>;
}

export interface BacktestConfig {
  strategy: 'ma-crossover' | 'rsi' | 'bollinger' | 'macd';
  initialCapital: number;
  positionSize: number;
  commission: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
}

function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      const slice = data.slice(0, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
  }
  return result;
}

function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  result[0] = data[0];
  
  for (let i = 1; i < data.length; i++) {
    result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
  }
  
  return result;
}

function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(50);
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
  }

  return [50, ...result];
}

function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(data[i] * 1.02);
      lower.push(data[i] * 0.98);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }

  return { upper, middle, lower };
}

function calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  
  const macd = emaFast.map((val, i) => val - emaSlow[i]);
  const signal = calculateEMA(macd, signalPeriod);
  const histogram = macd.map((val, i) => val - signal[i]);

  return { macd, signal, histogram };
}

function generateSignals(klines: KlineData[], strategy: string): Array<'BUY' | 'SELL' | 'HOLD'> {
  const closes = klines.map(k => k.close);
  const highs = klines.map(k => k.high);
  const lows = klines.map(k => k.low);
  const signals: Array<'BUY' | 'SELL' | 'HOLD'> = new Array(klines.length).fill('HOLD');

  switch (strategy) {
    case 'ma-crossover': {
      const ema9 = calculateEMA(closes, 9);
      const ema21 = calculateEMA(closes, 21);
      const ema55 = calculateEMA(closes, 55);
      
      for (let i = 55; i < klines.length; i++) {
        const trendUp = ema21[i] > ema55[i];
        const trendDown = ema21[i] < ema55[i];
        
        if (trendUp && ema9[i - 1] <= ema21[i - 1] && ema9[i] > ema21[i]) {
          signals[i] = 'BUY';
        } else if (trendDown && ema9[i - 1] >= ema21[i - 1] && ema9[i] < ema21[i]) {
          signals[i] = 'SELL';
        }
      }
      break;
    }

    case 'rsi': {
      const rsi = calculateRSI(closes, 14);
      const ema50 = calculateEMA(closes, 50);
      
      for (let i = 50; i < klines.length; i++) {
        const trendUp = closes[i] > ema50[i];
        const trendDown = closes[i] < ema50[i];
        
        if (trendUp && rsi[i - 1] <= 35 && rsi[i] > 35) {
          signals[i] = 'BUY';
        } else if (trendDown && rsi[i - 1] >= 65 && rsi[i] < 65) {
          signals[i] = 'SELL';
        }
      }
      break;
    }

    case 'bollinger': {
      const bb = calculateBollingerBands(closes, 20, 2);
      const ema50 = calculateEMA(closes, 50);
      
      for (let i = 50; i < klines.length; i++) {
        const trendUp = closes[i] > ema50[i];
        const trendDown = closes[i] < ema50[i];
        
        const priceBelowLower = lows[i] <= bb.lower[i] && closes[i] > bb.lower[i];
        const priceAboveUpper = highs[i] >= bb.upper[i] && closes[i] < bb.upper[i];
        
        if (trendUp && priceBelowLower) {
          signals[i] = 'BUY';
        } else if (trendDown && priceAboveUpper) {
          signals[i] = 'SELL';
        }
      }
      break;
    }

    case 'macd': {
      const macdData = calculateMACD(closes, 12, 26, 9);
      const ema200 = calculateEMA(closes, 200);
      
      for (let i = 200; i < klines.length; i++) {
        const trendUp = closes[i] > ema200[i];
        const trendDown = closes[i] < ema200[i];
        
        const bullishCross = macdData.histogram[i - 1] <= 0 && macdData.histogram[i] > 0;
        const bearishCross = macdData.histogram[i - 1] >= 0 && macdData.histogram[i] < 0;
        
        if (trendUp && bullishCross && macdData.macd[i] < 0) {
          signals[i] = 'BUY';
        } else if (trendDown && bearishCross && macdData.macd[i] > 0) {
          signals[i] = 'SELL';
        }
      }
      break;
    }
  }

  return signals;
}

export function runBacktest(klines: KlineData[], config: BacktestConfig): BacktestResults {
  const signals = generateSignals(klines, config.strategy);
  const trades: BacktestTrade[] = [];
  let equity = config.initialCapital;
  let maxEquity = config.initialCapital;
  let maxDrawdown = 0;
  const equityCurve: Array<{ time: string; equity: number; pnl: number }> = [];
  
  let position: { side: 'LONG' | 'SHORT'; entryPrice: number; entryTime: string; size: number } | null = null;

  for (let i = 0; i < klines.length; i++) {
    const kline = klines[i];
    const signal = signals[i];
    const currentPrice = kline.close;

    if (position) {
      let shouldClose = false;
      let reason = '';

      if (position.side === 'LONG') {
        const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100 * config.leverage;
        
        if (config.stopLoss && pnlPercent <= -config.stopLoss) {
          shouldClose = true;
          reason = 'Stop-Loss';
        } else if (config.takeProfit && pnlPercent >= config.takeProfit) {
          shouldClose = true;
          reason = 'Take-Profit';
        }
      } else {
        const pnlPercent = ((position.entryPrice - currentPrice) / position.entryPrice) * 100 * config.leverage;
        
        if (config.stopLoss && pnlPercent <= -config.stopLoss) {
          shouldClose = true;
          reason = 'Stop-Loss';
        } else if (config.takeProfit && pnlPercent >= config.takeProfit) {
          shouldClose = true;
          reason = 'Take-Profit';
        }
      }

      if ((signal === 'SELL' && position.side === 'LONG') || (signal === 'BUY' && position.side === 'SHORT')) {
        shouldClose = true;
        reason = 'Signal';
      }

      if (shouldClose) {
        const pnl = position.side === 'LONG'
          ? (currentPrice - position.entryPrice) * position.size * config.leverage
          : (position.entryPrice - currentPrice) * position.size * config.leverage;
        
        const entryValue = position.entryPrice * position.size;
        const exitValue = currentPrice * position.size;
        const commission = (entryValue * (config.commission / 100)) + (exitValue * (config.commission / 100));
        const netPnl = pnl - commission;
        const pnlPercent = (netPnl / equity) * 100;

        equity += netPnl;

        trades.push({
          entryTime: position.entryTime,
          exitTime: kline.time,
          entryPrice: position.entryPrice,
          exitPrice: currentPrice,
          side: position.side,
          pnl: netPnl,
          pnlPercent,
          reason
        });

        position = null;
      }
    }

    if (!position && signal !== 'HOLD') {
      const positionValue = equity * (config.positionSize / 100);
      const size = positionValue / currentPrice;
      
      position = {
        side: signal === 'BUY' ? 'LONG' : 'SHORT',
        entryPrice: currentPrice,
        entryTime: kline.time,
        size
      };
    }

    if (equity > maxEquity) {
      maxEquity = equity;
    }
    const drawdown = maxEquity - equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    equityCurve.push({
      time: kline.time,
      equity,
      pnl: equity - config.initialCapital
    });
  }

  if (position) {
    const currentPrice = klines[klines.length - 1].close;
    const pnl = position.side === 'LONG'
      ? (currentPrice - position.entryPrice) * position.size * config.leverage
      : (position.entryPrice - currentPrice) * position.size * config.leverage;
    
    const entryValue = position.entryPrice * position.size;
    const exitValue = currentPrice * position.size;
    const commission = (entryValue * (config.commission / 100)) + (exitValue * (config.commission / 100));
    const netPnl = pnl - commission;
    const pnlPercent = (netPnl / equity) * 100;

    equity += netPnl;

    trades.push({
      entryTime: position.entryTime,
      exitTime: klines[klines.length - 1].time,
      entryPrice: position.entryPrice,
      exitPrice: currentPrice,
      side: position.side,
      pnl: netPnl,
      pnlPercent,
      reason: 'End of backtest'
    });
  }

  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
  
  const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

  const returns = equityCurve.map((e, i) => 
    i === 0 ? 0 : (e.equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity
  );
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdReturn = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

  const monthlyStats: Array<{ month: string; profit: number; loss: number; winRate: number; trades: number }> = [];
  const monthlyData: { [key: string]: BacktestTrade[] } = {};

  trades.forEach(trade => {
    const date = new Date(parseInt(trade.entryTime));
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(trade);
  });

  Object.keys(monthlyData).sort().forEach(monthKey => {
    const monthTrades = monthlyData[monthKey];
    const wins = monthTrades.filter(t => t.pnl > 0);
    const losses = monthTrades.filter(t => t.pnl < 0);
    
    monthlyStats.push({
      month: monthKey,
      profit: wins.reduce((sum, t) => sum + t.pnl, 0),
      loss: Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0)),
      winRate: monthTrades.length > 0 ? (wins.length / monthTrades.length) * 100 : 0,
      trades: monthTrades.length
    });
  });

  const totalPnL = equity - config.initialCapital;
  const totalPnLPercent = (totalPnL / config.initialCapital) * 100;
  const maxDrawdownPercent = (maxDrawdown / maxEquity) * 100;

  return {
    trades,
    totalPnL,
    totalPnLPercent,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    maxDrawdown,
    maxDrawdownPercent,
    sharpeRatio,
    profitFactor,
    avgWin,
    avgLoss,
    equityCurve,
    monthlyStats
  };
}