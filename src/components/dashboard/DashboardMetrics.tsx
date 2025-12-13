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
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Badge variant={apiMode === 'live' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
            <Icon name={apiMode === 'live' ? 'Zap' : 'TestTube'} size={10} className="mr-1" />
            API: {apiMode === 'live' ? 'Боевой' : 'Тестовый'}
          </Badge>
          <Badge variant={accountMode === 'live' ? 'default' : 'outline'} className="text-[10px] h-5">
            <Icon name="Wallet" size={10} className="mr-1" />
            Счёт: {accountMode === 'live' ? 'Боевой' : 'Демо'}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="border-r border-border pr-4">
            <div className="text-[10px] text-muted-foreground mb-0.5">Баланс счета</div>
            <div className="text-base font-bold font-mono">${totalEquity.toFixed(2)}</div>
            <div className="text-[9px] text-muted-foreground">Доступно: ${totalAvailable.toFixed(2)}</div>
          </div>

          <div className="border-r border-border pr-4">
            <div className="text-[10px] text-muted-foreground mb-0.5">Общий PnL</div>
            <div className={`text-base font-bold font-mono ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USDT
            </div>
            <div className={`text-[9px] ${totalPnLPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
            </div>
          </div>

          <div className="border-r border-border pr-4">
            <div className="text-[10px] text-muted-foreground mb-0.5">Открытые позиции</div>
            <div className="text-base font-bold font-mono">{openPositions}</div>
            <div className="text-[9px] text-muted-foreground">Общее плечо: 10x</div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Винрейт</div>
            <div className="text-base font-bold font-mono text-success">68.4%</div>
            <div className="text-[9px] text-muted-foreground">За 24ч: 12/18 сделок</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
