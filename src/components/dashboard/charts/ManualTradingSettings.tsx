import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { getCurrentPrice } from '@/lib/api';

interface ManualTradingSettingsProps {
  accountMode: 'live' | 'demo';
  apiMode: 'live' | 'testnet';
  symbol?: string;
}

export default function ManualTradingSettings({ accountMode, apiMode, symbol = 'BTCUSDT' }: ManualTradingSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [entryMode, setEntryMode] = useState<'single' | 'grid' | 'dca'>('single');
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [volume, setVolume] = useState('100');
  const [leverage, setLeverage] = useState('10');
  const [stopLoss, setStopLoss] = useState('2.5');
  const [takeProfit, setTakeProfit] = useState('5.0');
  const [entryPrice, setEntryPrice] = useState('');
  const [useMarketPrice, setUseMarketPrice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleMarketPrice = async () => {
    try {
      setIsLoading(true);
      const price = await getCurrentPrice(symbol);
      setEntryPrice(price.toFixed(2));
      setUseMarketPrice(true);
      toast.success(`Рыночная цена: $${price.toFixed(2)}`);
    } catch (error) {
      toast.error('Не удалось получить рыночную цену');
      console.error('Market price fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrade = async () => {
    setIsLoading(true);
    try {
      const action = side === 'LONG' ? 'Покупка' : 'Продажа';
      const priceType = useMarketPrice ? 'по рынку' : `по цене $${entryPrice}`;
      toast.success(`${action} ${priceType}`);
    } catch (error) {
      toast.error('Ошибка выполнения сделки');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-black/90 border-zinc-800 flex flex-col" style={isExpanded ? { minHeight: '400px' } : {}}>
      <CardHeader className={`cursor-pointer flex-shrink-0 ${isExpanded ? 'pb-2' : 'py-2'}`} onClick={() => setIsExpanded(!isExpanded)}>
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
      {isExpanded && (
        <CardContent className="space-y-3 pt-2 flex-1 overflow-y-auto">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">Тип рынка</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => setMarketType('spot')}
                    className={`h-7 px-2 rounded-md border text-xs font-medium transition-colors ${
                      marketType === 'spot' 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon name="Coins" size={12} className="inline mr-1" />
                    Спот
                  </button>
                  <button 
                    onClick={() => setMarketType('futures')}
                    className={`h-7 px-2 rounded-md border text-xs font-medium transition-colors ${
                      marketType === 'futures' 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon name="TrendingUp" size={12} className="inline mr-1" />
                    Фьючерсы
                  </button>
                </div>
              </div>

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

              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">Цена входа</Label>
                <div className="flex gap-1.5">
                  <Input 
                    type="number" 
                    value={entryPrice}
                    onChange={(e) => { setEntryPrice(e.target.value); setUseMarketPrice(false); }}
                    placeholder="42500"
                    className="h-7 text-xs font-mono flex-1"
                    disabled={useMarketPrice}
                  />
                  <Button 
                    onClick={handleMarketPrice}
                    variant={useMarketPrice ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs px-2 whitespace-nowrap"
                  >
                    <Icon name="Zap" size={12} className="mr-1" />
                    По рынку
                  </Button>
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

              <Button 
                onClick={handleTrade}
                disabled={isLoading}
                className={`w-full h-8 text-xs ${
                  side === 'LONG' 
                    ? 'bg-success hover:bg-success/90' 
                    : 'bg-destructive hover:bg-destructive/90'
                } text-white`}
              >
                <Icon name={side === 'LONG' ? 'TrendingUp' : 'TrendingDown'} size={14} className="mr-1" />
                {side === 'LONG' ? 'Купить' : 'Продать'}
              </Button>

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
        </CardContent>
      )}
    </Card>
  );
}