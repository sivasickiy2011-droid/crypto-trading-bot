import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  volume: string;
  signal: string;
}

interface DashboardSidePanelsProps {
  watchlist: WatchlistItem[];
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  onConfigOpen: () => void;
}

export default function DashboardSidePanels({
  watchlist,
  selectedStrategy,
  onStrategyChange,
  onConfigOpen
}: DashboardSidePanelsProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Избранное</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {watchlist.map((item) => (
                <div key={item.symbol} className="p-2.5 rounded hover:bg-secondary transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{item.symbol}</span>
                    <Badge 
                      variant={item.signal === 'buy' ? 'default' : item.signal === 'sell' ? 'destructive' : 'secondary'}
                      className="text-xs px-1.5 py-0"
                    >
                      {item.signal}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">${item.price}</span>
                    <span className={`text-xs font-medium ${item.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {item.change >= 0 ? '+' : ''}{item.change}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Vol: {item.volume}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Управление стратегиями</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Активная стратегия</Label>
            <Select value={selectedStrategy} onValueChange={onStrategyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ma-crossover">Пересечение MA</SelectItem>
                <SelectItem value="martingale">Мартингейл</SelectItem>
                <SelectItem value="combined">Комбинированная</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Включить пересечение MA</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Включить Мартингейл</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Авто стоп-лосс</Label>
              <Switch defaultChecked />
            </div>
          </div>

          <Button className="w-full" variant="outline" onClick={onConfigOpen}>
            <Icon name="Settings" size={16} className="mr-2" />
            Настроить стратегию
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
