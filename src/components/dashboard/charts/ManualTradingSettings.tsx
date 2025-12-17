import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { getCurrentPrice, placeOrder, PlaceOrderParams } from '@/lib/api';

interface ManualTradingSettingsProps {
  accountMode: 'live' | 'demo';
  apiMode: 'live' | 'testnet';
  symbol?: string;
  availableBalance?: number;
  onOrderPlaced?: () => void;
  userId?: number;
}

export default function ManualTradingSettings({ accountMode, apiMode, symbol = 'BTCUSDT', availableBalance = 0, onOrderPlaced, userId }: ManualTradingSettingsProps) {
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [entryMode, setEntryMode] = useState<'single' | 'grid' | 'dca'>('single');
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [volume, setVolume] = useState('100');
  const [leverage, setLeverage] = useState('10');
  const [stopLoss, setStopLoss] = useState('2.5');
  const [takeProfit, setTakeProfit] = useState('5.0');
  const [entryPrice, setEntryPrice] = useState('');
  const [useMarketPrice, setUseMarketPrice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const volumeNum = parseFloat(volume) || 0;
  const priceNum = parseFloat(entryPrice) || 0;
  const lotSize = priceNum > 0 ? volumeNum / priceNum : 0;
  const isVolumeValid = volumeNum <= availableBalance;

  const handleMarketPrice = async () => {
    try {
      setIsLoading(true);
      const category = marketType === 'spot' ? 'spot' : 'linear';
      const price = await getCurrentPrice(symbol, category);
      setEntryPrice(price.toFixed(2));
      setUseMarketPrice(true);
      toast.success(`Рыночная цена ${marketType === 'spot' ? 'спот' : 'фьючерсы'}: $${price.toFixed(2)}`);
    } catch (error) {
      toast.error('Не удалось получить рыночную цену');
      console.error('Market price fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!userId) {
      toast.error('Необходима авторизация');
      return;
    }

    if (!entryPrice && !useMarketPrice) {
      toast.error('Укажите цену входа или выберите рыночную цену');
      return;
    }

    setIsLoading(true);
    try {
      const orderParams: PlaceOrderParams = {
        symbol,
        side: side === 'LONG' ? 'Buy' : 'Sell',
        orderType: useMarketPrice ? 'Market' : 'Limit',
        qty: (volumeNum / (parseFloat(entryPrice) || 1)).toFixed(6),
        category: marketType === 'spot' ? 'spot' : 'linear',
      };

      if (!useMarketPrice && entryPrice) {
        orderParams.price = entryPrice;
      }

      if (marketType === 'futures') {
        orderParams.leverage = parseInt(leverage);
        if (stopLoss) {
          const slPrice = side === 'LONG'
            ? (parseFloat(entryPrice) * (1 - parseFloat(stopLoss) / 100)).toFixed(2)
            : (parseFloat(entryPrice) * (1 + parseFloat(stopLoss) / 100)).toFixed(2);
          orderParams.stopLoss = slPrice;
        }
        if (takeProfit) {
          const tpPrice = side === 'LONG'
            ? (parseFloat(entryPrice) * (1 + parseFloat(takeProfit) / 100)).toFixed(2)
            : (parseFloat(entryPrice) * (1 - parseFloat(takeProfit) / 100)).toFixed(2);
          orderParams.takeProfit = tpPrice;
        }
      }

      const result = await placeOrder(userId, orderParams);

      if (result.success) {
        const action = side === 'LONG' ? 'Покупка' : 'Продажа';
        const priceType = useMarketPrice ? 'по рынку' : `по цене $${entryPrice}`;
        toast.success(`${action} ${priceType} - Ордер размещен`);
        onOrderPlaced?.();
      } else {
        toast.error(result.error || 'Ошибка выполнения сделки');
      }
    } catch (error) {
      toast.error('Ошибка выполнения сделки');
      console.error('Place order error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end space-x-1">
        <Badge variant={apiMode === 'live' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
          <Icon name={apiMode === 'live' ? 'Zap' : 'TestTube'} size={10} className="mr-1" />
          API: {apiMode === 'live' ? 'Боевой' : 'Тестовый'}
        </Badge>
        <Badge variant={accountMode === 'live' ? 'default' : 'outline'} className="text-[10px] h-5">
          <Icon name="Wallet" size={10} className="mr-1" />
          {accountMode === 'live' ? 'Боевой' : 'Демо'}
        </Badge>
      </div>

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
          <Label className="text-[10px] text-muted-foreground">Объём (USDT)</Label>
          <Input 
            type="number" 
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            placeholder="100"
            className={`h-7 text-xs font-mono ${!isVolumeValid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {!isVolumeValid && (
            <p className="text-[9px] text-destructive">Недостаточно средств</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Плечо</Label>
          <Select value={leverage} onValueChange={setLeverage} disabled={marketType === 'spot'}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5, 10, 20, 50, 100].map(lev => (
                <SelectItem key={lev} value={String(lev)} className="text-xs">
                  {lev}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Stop Loss (%)</Label>
          <Input 
            type="number" 
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="2.5"
            className="h-7 text-xs font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Take Profit (%)</Label>
          <Input 
            type="number" 
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="5.0"
            className="h-7 text-xs font-mono"
          />
        </div>
      </div>

      <div className="pt-2 space-y-1.5">
        <div className="text-[10px] text-muted-foreground space-y-0.5">
          <div className="flex justify-between">
            <span>Размер позиции:</span>
            <span className="font-mono">{lotSize.toFixed(4)} {symbol.replace('USDT', '')}</span>
          </div>
          <div className="flex justify-between">
            <span>Доступно:</span>
            <span className="font-mono">${availableBalance.toFixed(2)} USDT</span>
          </div>
        </div>
        <Button 
          onClick={handleTrade}
          disabled={!isVolumeValid || isLoading}
          className={`w-full h-8 text-xs font-semibold ${
            side === 'LONG' 
              ? 'bg-success hover:bg-success/90' 
              : 'bg-destructive hover:bg-destructive/90'
          }`}
        >
          {isLoading ? (
            <Icon name="Loader2" size={14} className="animate-spin mr-2" />
          ) : (
            <Icon name={side === 'LONG' ? 'ArrowUp' : 'ArrowDown'} size={14} className="mr-2" />
          )}
          {side === 'LONG' ? 'Купить' : 'Продать'} {marketType === 'spot' ? 'Спот' : 'Фьючерсы'}
        </Button>
      </div>
    </div>
  );
}