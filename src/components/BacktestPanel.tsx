import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getKlineData } from '@/lib/api';
import { runBacktest, BacktestResults, BacktestConfig } from '@/lib/backtest';
import BacktestSettings from './backtest/BacktestSettings';
import BacktestMetrics from './backtest/BacktestMetrics';
import BacktestCharts from './backtest/BacktestCharts';

export default function BacktestPanel() {
  const [strategy, setStrategy] = useState<'ma-crossover' | 'rsi' | 'bollinger' | 'macd'>('ma-crossover');
  const [timeframe, setTimeframe] = useState('1000');
  const [initialCapital, setInitialCapital] = useState('10000');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [positionSize, setPositionSize] = useState('20');
  const [leverage, setLeverage] = useState('2');
  const [stopLoss, setStopLoss] = useState('3');
  const [takeProfit, setTakeProfit] = useState('10');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResults | null>(null);

  const handleRunBacktest = async () => {
    setIsRunning(true);
    try {
      const klines = await getKlineData(symbol, '1h', parseInt(timeframe));
      
      const config: BacktestConfig = {
        strategy,
        initialCapital: parseFloat(initialCapital),
        positionSize: parseFloat(positionSize),
        commission: 0.055,
        leverage: parseFloat(leverage),
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit)
      };

      const backtestResults = runBacktest(klines, config);
      setResults(backtestResults);
    } catch (error) {
      console.error('Backtest error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Движок бэктестинга</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Тестируйте стратегии на исторических данных перед реальной торговлей
              </p>
            </div>
            <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "animate-pulse-subtle" : ""}>
              {isRunning ? 'ЗАПУЩЕН' : 'ГОТОВ'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <BacktestSettings
            strategy={strategy}
            setStrategy={setStrategy}
            symbol={symbol}
            setSymbol={setSymbol}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            initialCapital={initialCapital}
            setInitialCapital={setInitialCapital}
            positionSize={positionSize}
            setPositionSize={setPositionSize}
            leverage={leverage}
            setLeverage={setLeverage}
            stopLoss={stopLoss}
            setStopLoss={setStopLoss}
            takeProfit={takeProfit}
            setTakeProfit={setTakeProfit}
            isRunning={isRunning}
            onRunBacktest={handleRunBacktest}
          />
        </CardContent>
      </Card>

      <BacktestMetrics results={results} />

      <Separator className="bg-border" />

      <BacktestCharts results={results} />

      {results && results.trades.length > 0 && (
        <>
          <Separator className="bg-border" />
          
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-sm">Детальная статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Средняя прибыль</p>
                  <p className="font-mono text-success">${results.avgWin.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Средний убыток</p>
                  <p className="font-mono text-destructive">${results.avgLoss.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Profit Factor</p>
                  <p className="font-mono">{results.profitFactor.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Sharpe Ratio</p>
                  <p className="font-mono">{results.sharpeRatio.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Max Drawdown</p>
                  <p className="font-mono text-destructive">-{results.maxDrawdownPercent.toFixed(2)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Всего сделок</p>
                  <p className="font-mono">{results.trades.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}