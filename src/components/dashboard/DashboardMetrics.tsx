import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { UserBalanceData } from '@/lib/api';

interface DashboardMetricsProps {
  totalPnL: number;
  totalPnLPercent: number;
  openPositions: number;
  balance?: UserBalanceData | null;
  apiMode: 'live' | 'testnet';
  accountMode: 'live' | 'demo';
}

export default function DashboardMetrics({ 
  totalPnL, 
  totalPnLPercent, 
  openPositions,
  balance,
  apiMode,
  accountMode
}: DashboardMetricsProps) {
  const totalEquity = balance?.totalEquity || 24580;
  const totalAvailable = balance?.totalAvailable || 18420;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Badge variant={apiMode === 'live' ? 'destructive' : 'secondary'} className="text-xs">
          <Icon name={apiMode === 'live' ? 'Zap' : 'TestTube'} size={12} className="mr-1" />
          API: {apiMode === 'live' ? 'Боевой' : 'Тестовый'}
        </Badge>
        <Badge variant={accountMode === 'live' ? 'default' : 'outline'} className="text-xs">
          <Icon name="Wallet" size={12} className="mr-1" />
          Счёт: {accountMode === 'live' ? 'Боевой' : 'Демо'}
        </Badge>
      </div>
      <div className="grid grid-cols-4 gap-3">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Баланс счета</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold font-mono">${totalEquity.toFixed(2)}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Доступно: ${totalAvailable.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Общий PnL</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className={`text-xl font-bold font-mono ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USDT
          </div>
          <p className={`text-[10px] mt-0.5 ${totalPnLPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
            {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Открытые позиции</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold font-mono">{openPositions}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Общее плечо: 10x</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Винрейт</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold font-mono text-success">68.4%</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">За 24ч: 12/18 сделок</p>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}