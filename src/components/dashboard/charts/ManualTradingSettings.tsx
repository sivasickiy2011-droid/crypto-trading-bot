import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface ManualTradingSettingsProps {
  accountMode: 'live' | 'demo';
  apiMode: 'live' | 'testnet';
}

export default function ManualTradingSettings({ accountMode, apiMode }: ManualTradingSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [entryMode, setEntryMode] = useState<'single' | 'grid' | 'dca'>('single');
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [volume, setVolume] = useState('100');
  const [leverage, setLeverage] = useState('10');
  const [stopLoss, setStopLoss] = useState('2.5');
  const [takeProfit, setTakeProfit] = useState('5.0');
  const [hasPosition, setHasPosition] = useState(false);
  const [hasOrder, setHasOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrade = async (action: 'BUY' | 'SELL') => {
    setIsLoading(true);
    try {
      toast.success(`${action === 'BUY' ? 'Покупка' : 'Продажа'} по рынку`);
      setHasPosition(true);
    } catch (error) {
      toast.error('Ошибка выполнения сделки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePosition = async () => {
    setIsLoading(true);
    try {
      toast.success('Позиция закрыта по рынку');
      setHasPosition(false);
    } catch (error) {
      toast.error('Ошибка закрытия позиции');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsLoading(true);
    try {
      toast.success('Заявка отменена');
      setHasOrder(false);
    } catch (error) {
      toast.error('Ошибка отмены заявки');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-black/90 border-zinc-800 flex flex-col" style={{ minHeight: '400px' }}>
      <CardHeader className="pb-2 cursor-pointer flex-shrink-0" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-xs text-white">Ручная торговля</CardTitle>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
              <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
            </Button>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant={apiMode === 'live' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
              <Icon name={apiMode === 'live' ? 'Zap' : 'TestTube'} size={10} className="mr-1" />
              API: {apiMode === 'live' ? 'Боевой' : 'Тестовый'}
            </Badge>
            <Badge variant={accountMode === 'live' ? 'default' : 'outline'} className="text-[10px] h-5">
              <Icon name="Wallet" size={10} className="mr-1" />
              {accountMode === 'live' ? 'Боевой' : 'Демо'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (<CardContent className="space-y-3 pt-2 flex-1 overflow-y-auto">
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Режим входа</Label>
          <Select value={entryMode} onValueChange={(val) => setEntryMode(val as 'single' | 'grid' | 'dca')}>
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
            <button 
              onClick={() => setSide('LONG')}
              className={`h-7 px-2 rounded-md border text-xs font-medium transition-colors ${
                side === 'LONG' 
                  ? 'border-success bg-success/10 text-success' 
                  : 'border-border bg-secondary/50 text-muted-foreground hover:border-success hover:bg-success/5'
              }`}
            >
              <Icon name="TrendingUp" size={12} className="inline mr-1" />
              Long
            </button>
            <button 
              onClick={() => setSide('SHORT')}
              className={`h-7 px-2 rounded-md border text-xs font-medium transition-colors ${
                side === 'SHORT' 
                  ? 'border-destructive bg-destructive/10 text-destructive' 
                  : 'border-border bg-secondary/50 text-muted-foreground hover:border-destructive hover:bg-destructive/5'
              }`}
            >
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
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Плечо</Label>
            <Select value={leverage} onValueChange={setLeverage}>
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
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Тейк-профит (%)</Label>
            <Input 
              type="number" 
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>

        {entryMode === 'single' && !hasPosition && !hasOrder && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button 
              onClick={() => { setSide('LONG'); handleTrade('BUY'); }}
              disabled={isLoading}
              className="h-8 text-xs bg-success hover:bg-success/90 text-white"
            >
              <Icon name="TrendingUp" size={14} className="mr-1" />
              Купить (LONG)
            </Button>
            <Button 
              onClick={() => { setSide('SHORT'); handleTrade('SELL'); }}
              disabled={isLoading}
              className="h-8 text-xs bg-destructive hover:bg-destructive/90 text-white"
            >
              <Icon name="TrendingDown" size={14} className="mr-1" />
              Продать (SHORT)
            </Button>
          </div>
        )}

        {hasPosition && (
          <div className="space-y-2 pt-2">
            <div className="p-2 bg-muted/50 rounded-md border border-border">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">Открытая позиция:</span>
                <Badge variant={side === 'LONG' ? 'default' : 'destructive'} className="text-[9px] h-4">
                  {side}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">PnL:</span>
                <span className="font-mono text-success">+$12.50 (+1.25%)</span>
              </div>
            </div>
            <Button 
              onClick={handleClosePosition}
              disabled={isLoading}
              className="w-full h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Icon name="XCircle" size={14} className="mr-1" />
              Закрыть по рынку
            </Button>
          </div>
        )}

        {hasOrder && (
          <div className="space-y-2 pt-2">
            <div className="p-2 bg-muted/50 rounded-md border border-border">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">Активная заявка:</span>
                <Badge variant="outline" className="text-[9px] h-4">
                  Лимитная
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Цена:</span>
                <span className="font-mono">$42,500</span>
              </div>
            </div>
            <Button 
              onClick={handleCancelOrder}
              disabled={isLoading}
              variant="outline"
              className="w-full h-8 text-xs border-destructive text-destructive hover:bg-destructive/10"
            >
              <Icon name="Ban" size={14} className="mr-1" />
              Отменить заявку
            </Button>
          </div>
        )}

        <div className="flex gap-1 pt-1">
          <Button 
            onClick={() => setHasPosition(!hasPosition)}
            variant="ghost"
            size="sm"
            className="h-6 text-[9px] px-2"
          >
            {hasPosition ? '✓ Позиция' : '○ Позиция'}
          </Button>
          <Button 
            onClick={() => setHasOrder(!hasOrder)}
            variant="ghost"
            size="sm"
            className="h-6 text-[9px] px-2"
          >
            {hasOrder ? '✓ Ордер' : '○ Ордер'}
          </Button>
        </div>

        <div className="pt-1 border-t border-border">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Параметры сделки:</span>
          </div>
          <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>• Объём сделки:</span>
              <span className="font-mono text-foreground">${volume}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>• С плечом {leverage}x:</span>
              <span className="font-mono text-foreground">${(parseFloat(volume) * parseFloat(leverage)).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>• Стоп-лосс:</span>
              <span className="font-mono text-destructive">-{stopLoss}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>• Тейк-профит:</span>
              <span className="font-mono text-success">+{takeProfit}%</span>
            </div>
          </div>
        </div>
      </CardContent>)}
    </Card>
  );
}