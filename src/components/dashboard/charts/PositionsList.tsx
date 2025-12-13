import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Position {
  id: number;
  pair: string;
  side: string;
  entry: number;
  current: number;
  size: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  status: string;
}

interface PositionsListProps {
  positions: Position[];
}

export default function PositionsList({ positions }: PositionsListProps) {
  if (positions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base">Открытые позиции</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map((position) => (
          <div key={position.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors">
            <div className="flex items-center space-x-4">
              <Badge variant={position.side === 'LONG' ? 'default' : 'destructive'} className="w-16 justify-center">
                {position.side}
              </Badge>
              <div>
                <div className="font-semibold">{position.pair}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  Вход: ${position.entry} • Объем: {position.size} • {position.leverage}x
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="font-mono text-sm">${position.current}</div>
                <div className="text-xs text-muted-foreground">Текущая</div>
              </div>
              <div className="text-right min-w-[100px]">
                <div className={`font-mono font-semibold ${position.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} USDT
                </div>
                <div className={`text-xs ${position.pnlPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                </div>
              </div>
              <Button size="sm" variant="destructive" className="h-8">
                <Icon name="X" size={14} className="mr-1" />
                Закрыть
              </Button>
            </div>
          </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
