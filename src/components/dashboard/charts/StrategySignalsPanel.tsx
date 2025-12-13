import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface StrategySignal {
  strategy: string;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  reason: string;
}

interface StrategySignalsPanelProps {
  strategySignals: StrategySignal[];
}

export default function StrategySignalsPanel({ strategySignals }: StrategySignalsPanelProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base">Сигналы стратегий</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {strategySignals.map((signal, idx) => {
            const signalColor = signal.signal === 'buy' ? 'text-success' : signal.signal === 'sell' ? 'text-destructive' : 'text-muted-foreground';
            const signalBg = signal.signal === 'buy' ? 'bg-success/10 border-success/30' : signal.signal === 'sell' ? 'bg-destructive/10 border-destructive/30' : 'bg-secondary border-border';
            const signalIcon = signal.signal === 'buy' ? 'TrendingUp' : signal.signal === 'sell' ? 'TrendingDown' : 'Minus';
            
            return (
              <div key={idx} className={`p-3 rounded-lg border ${signalBg} hover:opacity-80 transition-opacity`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon name={signalIcon} size={16} className={signalColor} />
                    <span className="font-semibold text-sm">{signal.strategy}</span>
                  </div>
                  <Badge variant={signal.signal === 'buy' ? 'default' : signal.signal === 'sell' ? 'destructive' : 'outline'} className="text-xs h-5">
                    {signal.signal === 'buy' ? 'ПОКУПКА' : signal.signal === 'sell' ? 'ПРОДАЖА' : 'НЕЙТРАЛЬНО'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{signal.reason}</span>
                  <span className={`font-mono font-semibold ${signalColor}`}>
                    {signal.strength}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {strategySignals.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Icon name="Activity" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нет активных сигналов</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
