import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface ManualTradingSettingsProps {
  accountMode: 'live' | 'demo';
}

export default function ManualTradingSettings({ accountMode }: ManualTradingSettingsProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs">Настройки ручной торговли</CardTitle>
          <Badge variant={accountMode === 'live' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
            <Icon name={accountMode === 'live' ? 'Zap' : 'TestTube'} size={10} className="mr-1" />
            {accountMode === 'live' ? 'Боевой' : 'Демо'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Режим входа</Label>
          <Select defaultValue="single">
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single" className="text-xs">Разовая сделка</SelectItem>
              <SelectItem value="grid" className="text-xs">Сетка ордеров</SelectItem>
              <SelectItem value="dca" className="text-xs">DCA усреднение</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Направление</Label>
          <div className="grid grid-cols-2 gap-1.5">
            <button className="h-7 px-2 rounded-md border border-success bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors">
              <Icon name="TrendingUp" size={12} className="inline mr-1" />
              Long
            </button>
            <button className="h-7 px-2 rounded-md border border-border bg-secondary/50 text-muted-foreground text-xs font-medium hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-colors">
              <Icon name="TrendingDown" size={12} className="inline mr-1" />
              Short
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Объём ($)</Label>
            <Input 
              type="number" 
              defaultValue="100" 
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Плечо</Label>
            <Select defaultValue="10">
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1" className="text-xs">1x</SelectItem>
                <SelectItem value="2" className="text-xs">2x</SelectItem>
                <SelectItem value="5" className="text-xs">5x</SelectItem>
                <SelectItem value="10" className="text-xs">10x</SelectItem>
                <SelectItem value="20" className="text-xs">20x</SelectItem>
                <SelectItem value="50" className="text-xs">50x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Стоп-лосс (%)</Label>
            <Input 
              type="number" 
              defaultValue="2.5" 
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Тейк-профит (%)</Label>
            <Input 
              type="number" 
              defaultValue="5.0" 
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>

        <div className="pt-1 border-t border-border">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">При клике по стакану:</span>
          </div>
          <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>• Объём сделки:</span>
              <span className="font-mono text-foreground">$100</span>
            </div>
            <div className="flex items-center justify-between">
              <span>• С плечом 10x:</span>
              <span className="font-mono text-foreground">$1,000</span>
            </div>
            <div className="flex items-center justify-between">
              <span>• Стоп-лосс:</span>
              <span className="font-mono text-destructive">-2.5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>• Тейк-профит:</span>
              <span className="font-mono text-success">+5.0%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
