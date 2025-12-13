import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { BacktestResults } from '@/lib/backtest';

interface BacktestMetricsProps {
  results: BacktestResults | null;
}

export default function BacktestMetrics({ results }: BacktestMetricsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal flex items-center">
            <Icon name="TrendingUp" size={14} className="mr-1.5" />
            Total PnL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-xl font-bold ${results && results.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
            {results ? `${results.totalPnL >= 0 ? '+' : ''}$${results.totalPnL.toFixed(2)}` : '$0.00'}
          </p>
          <p className="text-xs text-muted-foreground">
            {results ? `${results.totalPnLPercent >= 0 ? '+' : ''}${results.totalPnLPercent.toFixed(2)}%` : '0.00%'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal flex items-center">
            <Icon name="Percent" size={14} className="mr-1.5" />
            Win Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold">
            {results ? `${results.winRate.toFixed(1)}%` : '0.0%'}
          </p>
          <p className="text-xs text-muted-foreground">
            {results ? `${results.winningTrades}/${results.winningTrades + results.losingTrades} сделок` : '0/0 сделок'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal flex items-center">
            <Icon name="Activity" size={14} className="mr-1.5" />
            Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold">
            {results ? results.trades.length : 0}
          </p>
          <p className="text-xs text-muted-foreground">
            PF: {results ? results.profitFactor.toFixed(2) : '0.00'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal flex items-center">
            <Icon name="TrendingDown" size={14} className="mr-1.5" />
            Max Drawdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold text-destructive">
            {results ? `-$${results.maxDrawdown.toFixed(2)}` : '$0.00'}
          </p>
          <p className="text-xs text-muted-foreground">
            SR: {results ? results.sharpeRatio.toFixed(2) : '0.00'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
