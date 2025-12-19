import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { getUserSettings } from '@/lib/api';

interface MACrossoverStrategyModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (config: StrategyConfig) => void;
  symbol: string;
  userId: number;
}

export interface StrategyConfig {
  symbol: string;
  orderType: 'single' | 'grid';
  
  // Общие параметры
  side: 'Buy' | 'Sell';
  quantity: number;
  leverage: number;
  
  // Stop Loss / Take Profit
  stopLossEnabled: boolean;
  stopLossPercent: number;
  takeProfitEnabled: boolean;
  takeProfitPercent: number;
  
  // Параметры входа по сигналу
  entryOffsetPercent: number; // -1% от сигнала
  
  // Параметры сетки (только для orderType = 'grid')
  gridOrders: number;
  gridStep: number;
  gridMultiplier: number;
}

export default function MACrossoverStrategyModal({ open, onClose, onStart, symbol, userId }: MACrossoverStrategyModalProps) {
  const [orderType, setOrderType] = useState<'single' | 'grid'>('single');
  const [side, setSide] = useState<'Buy' | 'Sell'>('Buy');
  const [quantity, setQuantity] = useState('100');
  const [leverage, setLeverage] = useState('10');
  const [stopLossEnabled, setStopLossEnabled] = useState(true);
  const [stopLossPercent, setStopLossPercent] = useState('2');
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(true);
  const [takeProfitPercent, setTakeProfitPercent] = useState('5');
  const [entryOffsetPercent, setEntryOffsetPercent] = useState('-1');
  
  // Grid parameters
  const [gridOrders, setGridOrders] = useState('5');
  const [gridStep, setGridStep] = useState('1');
  const [gridMultiplier, setGridMultiplier] = useState('2');

  // Load user martingale settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings(userId);
        if (settings.martingale_orders) setGridOrders(settings.martingale_orders.toString());
        if (settings.martingale_step) setGridStep(settings.martingale_step.toString());
        if (settings.martingale_multiplier) setGridMultiplier(settings.martingale_multiplier.toString());
      } catch (error) {
        console.error('Failed to load user settings:', error);
      }
    };
    if (open) loadSettings();
  }, [open, userId]);

  const handleStart = () => {
    const config: StrategyConfig = {
      symbol,
      orderType,
      side,
      quantity: parseFloat(quantity),
      leverage: parseInt(leverage),
      stopLossEnabled,
      stopLossPercent: parseFloat(stopLossPercent),
      takeProfitEnabled,
      takeProfitPercent: parseFloat(takeProfitPercent),
      entryOffsetPercent: parseFloat(entryOffsetPercent),
      gridOrders: orderType === 'grid' ? parseInt(gridOrders) : 1,
      gridStep: orderType === 'grid' ? parseFloat(gridStep) : 0,
      gridMultiplier: orderType === 'grid' ? parseFloat(gridMultiplier) : 1
    };
    onStart(config);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="TrendingUp" size={20} />
            Запуск стратегии MA Crossover + RSI
          </DialogTitle>
          <DialogDescription>
            Вход: EMA(9) пересекает EMA(21) вверх + RSI {'>'} 50, со смещением {entryOffsetPercent}%
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Symbol */}
          <div className="space-y-2">
            <Label>Торговая пара</Label>
            <Input value={symbol} disabled className="font-mono" />
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <Label>Тип стратегии</Label>
            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'single' | 'grid')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">
                  <Icon name="Target" size={16} className="mr-2" />
                  Одиночная сделка
                </TabsTrigger>
                <TabsTrigger value="grid">
                  <Icon name="Grid3x3" size={16} className="mr-2" />
                  Сетка (Мартингейл)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator />

          {/* Side and Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Направление</Label>
              <Select value={side} onValueChange={(v) => setSide(v as 'Buy' | 'Sell')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buy">
                    <span className="flex items-center gap-2">
                      <Icon name="TrendingUp" size={16} className="text-green-500" />
                      Long (Покупка)
                    </span>
                  </SelectItem>
                  <SelectItem value="Sell">
                    <span className="flex items-center gap-2">
                      <Icon name="TrendingDown" size={16} className="text-red-500" />
                      Short (Продажа)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Объём (USDT)</Label>
              <Input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Плечо (Leverage)</Label>
            <Input 
              type="number" 
              value={leverage} 
              onChange={(e) => setLeverage(e.target.value)}
              placeholder="10"
              min="1"
              max="125"
            />
          </div>

          <Separator />

          {/* Entry Offset */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Icon name="ArrowDownToLine" size={16} />
              Смещение входа от сигнала (%)
            </Label>
            <Input 
              type="number" 
              value={entryOffsetPercent} 
              onChange={(e) => setEntryOffsetPercent(e.target.value)}
              placeholder="-1"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground">
              Отрицательное значение = вход ниже сигнала (для Long). Например: -1% означает вход на 1% ниже цены сигнала.
            </p>
          </div>

          <Separator />

          {/* Stop Loss */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Icon name="ShieldAlert" size={16} className="text-red-500" />
                Stop Loss
              </Label>
              <Switch checked={stopLossEnabled} onCheckedChange={setStopLossEnabled} />
            </div>
            {stopLossEnabled && (
              <Input 
                type="number" 
                value={stopLossPercent} 
                onChange={(e) => setStopLossPercent(e.target.value)}
                placeholder="2"
                step="0.1"
                suffix="%"
              />
            )}
          </div>

          {/* Take Profit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Icon name="Target" size={16} className="text-green-500" />
                Take Profit
              </Label>
              <Switch checked={takeProfitEnabled} onCheckedChange={setTakeProfitEnabled} />
            </div>
            {takeProfitEnabled && (
              <Input 
                type="number" 
                value={takeProfitPercent} 
                onChange={(e) => setTakeProfitPercent(e.target.value)}
                placeholder="5"
                step="0.1"
                suffix="%"
              />
            )}
          </div>

          {/* Grid Parameters (only for grid type) */}
          {orderType === 'grid' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Icon name="Grid3x3" size={16} />
                  Параметры сетки (Мартингейл)
                </h4>

                <div className="space-y-2">
                  <Label>Количество ордеров в сетке</Label>
                  <Input 
                    type="number" 
                    value={gridOrders} 
                    onChange={(e) => setGridOrders(e.target.value)}
                    placeholder="5"
                    min="2"
                    max="20"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Шаг сетки (%)</Label>
                  <Input 
                    type="number" 
                    value={gridStep} 
                    onChange={(e) => setGridStep(e.target.value)}
                    placeholder="1"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Расстояние между ордерами в процентах
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Множитель объёма</Label>
                  <Input 
                    type="number" 
                    value={gridMultiplier} 
                    onChange={(e) => setGridMultiplier(e.target.value)}
                    placeholder="2"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Каждый следующий ордер будет в X раз больше предыдущего
                  </p>
                </div>

                {/* Grid Preview */}
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Предпросмотр сетки:</p>
                  {Array.from({ length: Math.min(parseInt(gridOrders) || 1, 5) }).map((_, i) => {
                    const orderQty = parseFloat(quantity) * Math.pow(parseFloat(gridMultiplier), i);
                    const priceOffset = parseFloat(entryOffsetPercent) - (parseFloat(gridStep) * i);
                    return (
                      <div key={i} className="text-xs flex justify-between">
                        <span>Ордер {i + 1}:</span>
                        <span>{orderQty.toFixed(2)} USDT при {priceOffset.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                  {parseInt(gridOrders) > 5 && (
                    <p className="text-xs text-muted-foreground">...и ещё {parseInt(gridOrders) - 5} ордеров</p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Summary */}
          <div className="p-4 bg-primary/10 rounded-lg space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Icon name="Info" size={16} />
              Итого
            </h4>
            <div className="text-sm space-y-1">
              <p>• Стратегия: MA Crossover + RSI фильтр</p>
              <p>• Вход: {side === 'Buy' ? 'Long' : 'Short'} при сигнале {entryOffsetPercent}%</p>
              <p>• Объём: {quantity} USDT × {leverage}x плечо</p>
              <p>• Тип: {orderType === 'single' ? 'Одиночная сделка' : `Сетка из ${gridOrders} ордеров`}</p>
              {stopLossEnabled && <p>• Stop Loss: {stopLossPercent}%</p>}
              {takeProfitEnabled && <p>• Take Profit: {takeProfitPercent}%</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleStart} className="gap-2">
            <Icon name="Play" size={16} />
            Запустить бота
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
