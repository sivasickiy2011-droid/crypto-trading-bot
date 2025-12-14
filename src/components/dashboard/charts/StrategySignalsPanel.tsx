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
    <Card className="bg-black/90 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-base text-white">Сигналы стратегий</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {strategySignals.map((signal, idx) => {
            const signalColor = signal.signal === 'buy' ? 'text-green-400' : signal.signal === 'sell' ? 'text-red-400' : 'text-zinc-400';
            const signalBg = signal.signal === 'buy' ? 'bg-green-500/10 border-green-500/30' : signal.signal === 'sell' ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-800/50 border-zinc-700';
            const signalIcon = signal.signal === 'buy' ? 'TrendingUp' : signal.signal === 'sell' ? 'TrendingDown' : 'Minus';
            
            return (
              <div key={idx} className={`p-3 rounded-lg border ${signalBg} hover:opacity-80 transition-opacity`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon name={signalIcon} size={16} className={signalColor} />
                    <span className="font-semibold text-sm text-white">{signal.strategy}</span>
                  </div>
                  <Badge variant={signal.signal === 'buy' ? 'default' : signal.signal === 'sell' ? 'destructive' : 'outline'} className="text-xs h-5">
                    {signal.signal === 'buy' ? 'ПОКУПКА' : signal.signal === 'sell' ? 'ПРОДАЖА' : 'НЕЙТРАЛЬНО'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">{signal.reason}</span>
                  <span className={`font-mono font-semibold ${signalColor}`}>
                    {signal.strength}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {strategySignals.length === 0 && (
          <div className="text-center text-zinc-500 py-12">
            <Icon name="Activity" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нет активных сигналов</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}