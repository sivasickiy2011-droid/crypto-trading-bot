import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { BacktestResults } from '@/lib/backtest';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface BacktestChartsProps {
  results: BacktestResults | null;
}

export default function BacktestCharts({ results }: BacktestChartsProps) {
  const tradeDistribution = results ? [
    { range: '-10% и ниже', count: results.trades.filter(t => t.pnlPercent < -10).length, color: '#dc2626' },
    { range: '-10% to -5%', count: results.trades.filter(t => t.pnlPercent >= -10 && t.pnlPercent < -5).length, color: '#ef4444' },
    { range: '-5% to 0%', count: results.trades.filter(t => t.pnlPercent >= -5 && t.pnlPercent < 0).length, color: '#f97316' },
    { range: '0% to 5%', count: results.trades.filter(t => t.pnlPercent >= 0 && t.pnlPercent < 5).length, color: '#22c55e' },
    { range: '5% to 10%', count: results.trades.filter(t => t.pnlPercent >= 5 && t.pnlPercent < 10).length, color: '#10b981' },
    { range: '10% и выше', count: results.trades.filter(t => t.pnlPercent >= 10).length, color: '#059669' }
  ] : [];

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Icon name="TrendingUp" size={16} className="mr-2" />
            Кривая капитала (Equity Curve)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results && results.equityCurve.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={results.equityCurve.map(e => ({
                time: new Date(parseInt(e.time)).toLocaleString('ru', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                equity: e.equity
              }))}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickMargin={8}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Капитал']}
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Icon name="LineChart" size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Запустите бэктест, чтобы увидеть кривую капитала</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Icon name="BarChart3" size={16} className="mr-2" />
            Последние 20 сделок
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results && results.trades.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={results.trades.slice(-20).map((t, idx) => ({
                id: `#${idx + 1}`,
                pnl: t.pnl,
                fill: t.pnl >= 0 ? '#22c55e' : '#ef4444'
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="id" 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'PnL']}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Icon name="BarChart3" size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Запустите бэктест, чтобы увидеть сделки</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Icon name="PieChart" size={16} className="mr-2" />
            Распределение сделок по PnL
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results && results.trades.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Кол-во', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [value, 'Сделок']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tradeDistribution.map((entry, index) => (
                    <Bar key={`cell-${index}`} dataKey="count" fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Icon name="PieChart" size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Запустите бэктест, чтобы увидеть распределение</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Icon name="Calendar" size={16} className="mr-2" />
            Статистика по месяцам
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results && results.monthlyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={results.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px' }}
                  iconType="circle"
                />
                <Bar dataKey="profit" name="Прибыль" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="loss" name="Убыток" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Icon name="Calendar" size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Запустите бэктест, чтобы увидеть месячную статистику</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
