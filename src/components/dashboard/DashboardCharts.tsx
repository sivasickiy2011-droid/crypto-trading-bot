import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

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

interface DashboardChartsProps {
  priceData: Array<{
    time: string;
    price: number;
    ma20: number;
    ma50: number;
    signal: string | null;
  }>;
  positions: Position[];
}

export default function DashboardCharts({ priceData, positions }: DashboardChartsProps) {
  return (
    <div className="col-span-2 space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>BTC/USDT</CardTitle>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-xs">1m</Badge>
              <Badge variant="outline" className="text-xs">5m</Badge>
              <Badge className="text-xs">15m</Badge>
              <Badge variant="outline" className="text-xs">1h</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(220, 9%, 65%)" 
                  style={{ fontSize: '12px', fontFamily: 'Roboto Mono' }}
                />
                <YAxis 
                  stroke="hsl(220, 9%, 65%)" 
                  style={{ fontSize: '12px', fontFamily: 'Roboto Mono' }}
                  domain={['dataMin - 500', 'dataMax + 500']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(220, 13%, 12%)', 
                    border: '1px solid hsl(220, 13%, 20%)',
                    borderRadius: '6px',
                    fontFamily: 'Roboto Mono'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(199, 89%, 48%)" 
                  fill="url(#colorPrice)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="ma20" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="ma50" 
                  stroke="hsl(0, 84%, 60%)" 
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Открытые позиции</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {positions.map((position) => (
              <div key={position.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                <div className="flex items-center space-x-4">
                  <Badge variant={position.side === 'LONG' ? 'default' : 'destructive'} className="w-16 justify-center">
                    {position.side}
                  </Badge>
                  <div>
                    <div className="font-semibold">{position.pair}</div>
                    <div className="text-xs text-muted-foreground">
                      Вход: <span className="font-mono">${position.entry}</span> | 
                      Объем: <span className="font-mono">{position.size}</span> | 
                      {position.leverage}x
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="font-mono text-sm">${position.current}</div>
                    <div className="text-xs text-muted-foreground">Текущая</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-semibold ${position.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {position.pnl >= 0 ? '+' : ''}{position.pnl} USDT
                    </div>
                    <div className={`text-xs ${position.pnlPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%
                    </div>
                  </div>
                  <Button size="sm" variant="destructive">
                    <Icon name="X" size={14} className="mr-1" />
                    Закрыть
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
