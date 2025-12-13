import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserBalanceData } from '@/lib/api';

interface DashboardMetricsProps {
  totalPnL: number;
  totalPnLPercent: number;
  openPositions: number;
  balance?: UserBalanceData | null;
}

export default function DashboardMetrics({ 
  totalPnL, 
  totalPnLPercent, 
  openPositions,
  balance
}: DashboardMetricsProps) {
  const totalEquity = balance?.totalEquity || 24580;
  const totalAvailable = balance?.totalAvailable || 18420;
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Баланс счета</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">${totalEquity.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Доступно: ${totalAvailable.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Общий PnL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold font-mono ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USDT
          </div>
          <p className={`text-xs mt-1 ${totalPnLPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
            {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Открытые позиции</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">{openPositions}</div>
          <p className="text-xs text-muted-foreground mt-1">Общее плечо: 10x</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Винрейт</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-success">68.4%</div>
          <p className="text-xs text-muted-foreground mt-1">За 24ч: 12/18 сделок</p>
        </CardContent>
      </Card>
    </div>
  );
}