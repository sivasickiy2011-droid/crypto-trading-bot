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
  positionSize: number; // Процент от капитала на сделку
  commission: number; // Комиссия в процентах (например, 0.1 для 0.1%)
  leverage: number;
  stopLoss?: number; // В процентах
  takeProfit?: number; // В процентах
}

// Расчёт индикаторов
function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
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

  return [50, ...result]; // Добавляем первое значение
}

function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(data[i]);
      lower.push(data[i]);
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

function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  result[0] = data[0];
  
  for (let i = 1; i < data.length; i++) {
    result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
  }
  
  return result;
}

// Генерация сигналов по стратегиям
function generateSignals(klines: KlineData[], strategy: string): Array<'BUY' | 'SELL' | 'HOLD'> {
  const closes = klines.map(k => k.close);
  const signals: Array<'BUY' | 'SELL' | 'HOLD'> = new Array(klines.length).fill('HOLD');

  switch (strategy) {
    case 'ma-crossover': {
      const ma20 = calculateSMA(closes, 20);
      const ma50 = calculateSMA(closes, 50);
      
      for (let i = 1; i < klines.length; i++) {
        if (ma20[i - 1] < ma50[i - 1] && ma20[i] > ma50[i]) {
          signals[i] = 'BUY';
        } else if (ma20[i - 1] > ma50[i - 1] && ma20[i] < ma50[i]) {
          signals[i] = 'SELL';
        }
      }
      break;
    }

    case 'rsi': {
      const rsi = calculateRSI(closes, 14);
      
      for (let i = 1; i < klines.length; i++) {
        if (rsi[i - 1] > 30 && rsi[i] <= 30) {
          signals[i] = 'BUY'; // Перепроданность
        } else if (rsi[i - 1] < 70 && rsi[i] >= 70) {
          signals[i] = 'SELL'; // Перекупленность
        }
      }
      break;
    }

    case 'bollinger': {
      const bb = calculateBollingerBands(closes, 20, 2);
      
      for (let i = 1; i < klines.length; i++) {
        if (closes[i] < bb.lower[i] && closes[i - 1] >= bb.lower[i - 1]) {
          signals[i] = 'BUY'; // Цена коснулась нижней полосы
        } else if (closes[i] > bb.upper[i] && closes[i - 1] <= bb.upper[i - 1]) {
          signals[i] = 'SELL'; // Цена коснулась верхней полосы
        }
      }
      break;
    }

    case 'macd': {
      const macdData = calculateMACD(closes, 12, 26, 9);
      
      for (let i = 1; i < klines.length; i++) {
        if (macdData.histogram[i - 1] < 0 && macdData.histogram[i] > 0) {
          signals[i] = 'BUY'; // MACD пересекает сигнальную снизу вверх
        } else if (macdData.histogram[i - 1] > 0 && macdData.histogram[i] < 0) {
          signals[i] = 'SELL'; // MACD пересекает сигнальную сверху вниз
        }
      }
      break;
    }
  }

  return signals;
}

// Основная функция бэктестинга
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

    // Проверка стоп-лосса и тейк-профита для открытой позиции
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

      // Закрытие по сигналу
      if ((signal === 'SELL' && position.side === 'LONG') || (signal === 'BUY' && position.side === 'SHORT')) {
        shouldClose = true;
        reason = 'Signal';
      }

      if (shouldClose) {
        const pnl = position.side === 'LONG'
          ? (currentPrice - position.entryPrice) * position.size * config.leverage
          : (position.entryPrice - currentPrice) * position.size * config.leverage;
        
        const commission = (position.entryPrice * position.size + currentPrice * position.size) * (config.commission / 100);
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
          pnlPercent: pnlPercent,
          reason: reason
        });

        position = null;
      }
    }

    // Открытие новой позиции
    if (!position && signal !== 'HOLD') {
      const positionValue = equity * (config.positionSize / 100);
      const size = positionValue / currentPrice;
      
      position = {
        side: signal === 'BUY' ? 'LONG' : 'SHORT',
        entryPrice: currentPrice,
        entryTime: kline.time,
        size: size
      };
    }

    // Обновление кривой капитала
    maxEquity = Math.max(maxEquity, equity);
    const drawdown = ((maxEquity - equity) / maxEquity) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);

    equityCurve.push({
      time: kline.time,
      equity: equity,
      pnl: equity - config.initialCapital
    });
  }

  // Закрываем открытую позицию в конце
  if (position) {
    const lastKline = klines[klines.length - 1];
    const pnl = position.side === 'LONG'
      ? (lastKline.close - position.entryPrice) * position.size * config.leverage
      : (position.entryPrice - lastKline.close) * position.size * config.leverage;
    
    const commission = (position.entryPrice * position.size + lastKline.close * position.size) * (config.commission / 100);
    const netPnl = pnl - commission;
    const pnlPercent = (netPnl / equity) * 100;

    equity += netPnl;

    trades.push({
      entryTime: position.entryTime,
      exitTime: lastKline.time,
      entryPrice: position.entryPrice,
      exitPrice: lastKline.close,
      side: position.side,
      pnl: netPnl,
      pnlPercent: pnlPercent,
      reason: 'End of period'
    });
  }

  // Расчёт статистики
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

  // Sharpe Ratio (упрощённый)
  const returns = equityCurve.map(e => (e.equity - config.initialCapital) / config.initialCapital);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Годовой Sharpe

  // Месячная статистика
  const monthlyStats: Array<{ month: string; profit: number; loss: number; winRate: number; trades: number }> = [];
  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const tradesByMonth = new Map<string, BacktestTrade[]>();

  trades.forEach(trade => {
    const date = new Date(parseInt(trade.entryTime));
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!tradesByMonth.has(monthKey)) {
      tradesByMonth.set(monthKey, []);
    }
    tradesByMonth.get(monthKey)!.push(trade);
  });

  tradesByMonth.forEach((monthTrades, monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    const profit = monthTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const loss = monthTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0);
    const winRate = (monthTrades.filter(t => t.pnl > 0).length / monthTrades.length) * 100;

    monthlyStats.push({
      month: monthNames[month],
      profit: profit,
      loss: loss,
      winRate: winRate,
      trades: monthTrades.length
    });
  });

  return {
    trades,
    totalPnL: equity - config.initialCapital,
    totalPnLPercent: ((equity - config.initialCapital) / config.initialCapital) * 100,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
    maxDrawdown: maxDrawdown * config.initialCapital / 100,
    maxDrawdownPercent: maxDrawdown,
    sharpeRatio,
    profitFactor,
    avgWin,
    avgLoss,
    equityCurve,
    monthlyStats
  };
}
