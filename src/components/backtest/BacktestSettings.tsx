import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface BacktestSettingsProps {
  strategy: string;
  setStrategy: (value: 'ma-crossover' | 'rsi' | 'bollinger' | 'macd') => void;
  symbol: string;
  setSymbol: (value: string) => void;
  timeframe: string;
  setTimeframe: (value: string) => void;
  initialCapital: string;
  setInitialCapital: (value: string) => void;
  positionSize: string;
  setPositionSize: (value: string) => void;
  leverage: string;
  setLeverage: (value: string) => void;
  stopLoss: string;
  setStopLoss: (value: string) => void;
  takeProfit: string;
  setTakeProfit: (value: string) => void;
  isRunning: boolean;
  onRunBacktest: () => void;
}

export default function BacktestSettings({
  strategy,
  setStrategy,
  symbol,
  setSymbol,
  timeframe,
  setTimeframe,
  initialCapital,
  setInitialCapital,
  positionSize,
  setPositionSize,
  leverage,
  setLeverage,
  stopLoss,
  setStopLoss,
  takeProfit,
  setTakeProfit,
  isRunning,
  onRunBacktest
}: BacktestSettingsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label>Стратегия</Label>
        <Select value={strategy} onValueChange={setStrategy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ma-crossover">EMA 9/21/55 (тренд + кросс)</SelectItem>
            <SelectItem value="rsi">RSI 14 + EMA50 (отбой от зон)</SelectItem>
            <SelectItem value="bollinger">BB + EMA50 (отбой от границ)</SelectItem>
            <SelectItem value="macd">MACD + EMA200 (дивергенция)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Торговая пара</Label>
        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
            <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
            <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
            <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Количество свечей</Label>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="200">200 свечей (~2 дня)</SelectItem>
            <SelectItem value="500">500 свечей (~5 дней)</SelectItem>
            <SelectItem value="1000">1000 свечей (~10 дней)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Начальный капитал ($)</Label>
        <Select value={initialCapital} onValueChange={setInitialCapital}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5000">$5,000</SelectItem>
            <SelectItem value="10000">$10,000</SelectItem>
            <SelectItem value="25000">$25,000</SelectItem>
            <SelectItem value="50000">$50,000</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Размер позиции (%)</Label>
        <Select value={positionSize} onValueChange={setPositionSize}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5% капитала</SelectItem>
            <SelectItem value="10">10% капитала</SelectItem>
            <SelectItem value="20">20% капитала</SelectItem>
            <SelectItem value="50">50% капитала</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Плечо</Label>
        <Select value={leverage} onValueChange={setLeverage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1x (без плеча)</SelectItem>
            <SelectItem value="2">2x</SelectItem>
            <SelectItem value="5">5x</SelectItem>
            <SelectItem value="10">10x</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Стоп-лосс (%)</Label>
        <Select value={stopLoss} onValueChange={setStopLoss}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1%</SelectItem>
            <SelectItem value="2">2%</SelectItem>
            <SelectItem value="3">3%</SelectItem>
            <SelectItem value="5">5%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Тейк-профит (%)</Label>
        <Select value={takeProfit} onValueChange={setTakeProfit}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3%</SelectItem>
            <SelectItem value="5">5%</SelectItem>
            <SelectItem value="10">10%</SelectItem>
            <SelectItem value="15">15%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button 
          onClick={onRunBacktest}
          className="w-full"
          disabled={isRunning}
        >
          <Icon name={isRunning ? "Loader2" : "Play"} 
                size={16} 
                className={`mr-2 ${isRunning ? 'animate-spin' : ''}`} 
          />
          {isRunning ? 'Идёт бэктест...' : 'Запустить бэктест'}
        </Button>
      </div>
    </div>
  );
}