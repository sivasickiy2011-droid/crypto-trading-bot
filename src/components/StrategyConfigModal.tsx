import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { saveStrategyConfig, loadStrategyConfig } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface StrategyConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
}

export default function StrategyConfigModal({ open, onOpenChange, userId }: StrategyConfigModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [tradingMode, setTradingMode] = useState<'live' | 'backtest'>('backtest');
  
  const [maConfig, setMaConfig] = useState({
    enabled: true,
    shortPeriod: 20,
    longPeriod: 50,
    minVolume: 100000,
    stopLoss: 2.5,
    takeProfit: 5.0
  });

  const [martingaleConfig, setMartingaleConfig] = useState({
    enabled: true,
    maxLevels: 3,
    multiplier: 2.0,
    baseSize: 0.1,
    extremumPeriod: 7,
    minDistance: 3.0
  });

  const [riskConfig, setRiskConfig] = useState({
    maxPositions: 5,
    maxLeverage: 10,
    portfolioRisk: 20,
    dailyLossLimit: 500
  });

  useEffect(() => {
    if (open && userId) {
      loadStrategyConfig(userId).then(result => {
        if (result.success && result.configs) {
          result.configs.forEach((cfg: any) => {
            if (cfg.strategy_name === 'ma-crossover') {
              setMaConfig(cfg.config);
            } else if (cfg.strategy_name === 'martingale') {
              setMartingaleConfig(cfg.config);
            } else if (cfg.strategy_name === 'risk') {
              setRiskConfig(cfg.config);
            } else if (cfg.strategy_name === 'trading-mode') {
              setTradingMode(cfg.config.mode || 'backtest');
            }
          });
        }
      }).catch(() => {});
    }
  }, [open, userId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        saveStrategyConfig(userId, 'ma-crossover', maConfig),
        saveStrategyConfig(userId, 'martingale', martingaleConfig),
        saveStrategyConfig(userId, 'risk', riskConfig),
        saveStrategyConfig(userId, 'trading-mode', { mode: tradingMode })
      ]);
      
      toast({
        title: 'Успешно',
        description: 'Настройки стратегий сохранены',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span>Настройка стратегий</span>
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-normal text-muted-foreground">Режим:</Label>
              <Button
                variant={tradingMode === 'backtest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTradingMode('backtest')}
                className="h-7"
              >
                <Icon name="TestTube" size={14} className="mr-1" />
                Бектест
              </Button>
              <Button
                variant={tradingMode === 'live' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTradingMode('live')}
                className="h-7"
              >
                <Icon name="Zap" size={14} className="mr-1" />
                Боевой
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            {tradingMode === 'backtest' 
              ? '🧪 Тестовый режим: используется Bybit Testnet API для безопасного тестирования'
              : '⚡ Боевой режим: торговля на реальном счёте Bybit с реальными средствами'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ma-crossover" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ma-crossover">Пересечение MA</TabsTrigger>
            <TabsTrigger value="martingale">Мартингейл</TabsTrigger>
            <TabsTrigger value="risk">Управление рисками</TabsTrigger>
          </TabsList>

          <TabsContent value="ma-crossover" className="space-y-6 mt-6">
            <Card className="bg-secondary border-border">
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Включить стратегию пересечения MA</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Торговля на основе пересечения скользящих средних
                    </p>
                  </div>
                  <Switch 
                    checked={maConfig.enabled} 
                    onCheckedChange={(checked) => setMaConfig({...maConfig, enabled: checked})}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Короткий период (MA)</Label>
                      <span className="text-sm font-mono text-muted-foreground">{maConfig.shortPeriod}</span>
                    </div>
                    <Slider
                      value={[maConfig.shortPeriod]}
                      onValueChange={(val) => setMaConfig({...maConfig, shortPeriod: val[0]})}
                      min={5}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Быстрая скользящая средняя для генерации сигналов
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Длинный период (MA)</Label>
                      <span className="text-sm font-mono text-muted-foreground">{maConfig.longPeriod}</span>
                    </div>
                    <Slider
                      value={[maConfig.longPeriod]}
                      onValueChange={(val) => setMaConfig({...maConfig, longPeriod: val[0]})}
                      min={20}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Медленная скользящая средняя для подтверждения тренда
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Стоп-лосс (%)</Label>
                      <Input
                        type="number"
                        value={maConfig.stopLoss}
                        onChange={(e) => setMaConfig({...maConfig, stopLoss: parseFloat(e.target.value)})}
                        step="0.1"
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Тейк-профит (%)</Label>
                      <Input
                        type="number"
                        value={maConfig.takeProfit}
                        onChange={(e) => setMaConfig({...maConfig, takeProfit: parseFloat(e.target.value)})}
                        step="0.1"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Минимальный объем (USDT)</Label>
                    <Input
                      type="number"
                      value={maConfig.minVolume}
                      onChange={(e) => setMaConfig({...maConfig, minVolume: parseInt(e.target.value)})}
                      step="10000"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Торговать только парами с объемом выше этого порога
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center space-x-3">
                <Icon name="Info" size={20} className="text-primary" />
                <div>
                  <p className="text-sm font-medium">Сигнал стратегии</p>
                  <p className="text-xs text-muted-foreground">
                    Покупка при пересечении короткой MA над длинной, продажа наоборот
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="martingale" className="space-y-6 mt-6">
            <Card className="bg-secondary border-border">
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Включить стратегию Мартингейл</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Усреднение позиций на уровнях экстремумов
                    </p>
                  </div>
                  <Switch 
                    checked={martingaleConfig.enabled} 
                    onCheckedChange={(checked) => setMartingaleConfig({...martingaleConfig, enabled: checked})}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Максимум уровней</Label>
                      <span className="text-sm font-mono text-muted-foreground">{martingaleConfig.maxLevels}</span>
                    </div>
                    <Slider
                      value={[martingaleConfig.maxLevels]}
                      onValueChange={(val) => setMartingaleConfig({...martingaleConfig, maxLevels: val[0]})}
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Максимальное количество уровней усреднения
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Множитель позиции</Label>
                      <span className="text-sm font-mono text-muted-foreground">{martingaleConfig.multiplier.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[martingaleConfig.multiplier]}
                      onValueChange={(val) => setMartingaleConfig({...martingaleConfig, multiplier: val[0]})}
                      min={1.5}
                      max={3.0}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Множитель размера для каждого уровня
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Период экстремумов (дней)</Label>
                      <span className="text-sm font-mono text-muted-foreground">{martingaleConfig.extremumPeriod}</span>
                    </div>
                    <Slider
                      value={[martingaleConfig.extremumPeriod]}
                      onValueChange={(val) => setMartingaleConfig({...martingaleConfig, extremumPeriod: val[0]})}
                      min={1}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Поиск максимумов/минимумов за этот период
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Базовый размер</Label>
                      <Input
                        type="number"
                        value={martingaleConfig.baseSize}
                        onChange={(e) => setMartingaleConfig({...martingaleConfig, baseSize: parseFloat(e.target.value)})}
                        step="0.01"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Начальный размер позиции</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Мин. дистанция (%)</Label>
                      <Input
                        type="number"
                        value={martingaleConfig.minDistance}
                        onChange={(e) => setMartingaleConfig({...martingaleConfig, minDistance: parseFloat(e.target.value)})}
                        step="0.5"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Мин. изменение цены для срабатывания</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center space-x-3">
                <Icon name="AlertTriangle" size={20} className="text-destructive" />
                <div>
                  <p className="text-sm font-medium">Высокорискованная стратегия</p>
                  <p className="text-xs text-muted-foreground">
                    Мартингейл может привести к значительным убыткам на трендовых рынках
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6 mt-6">
            <Card className="bg-secondary border-border">
              <CardContent className="pt-6 space-y-5">
                <div>
                  <Label className="text-base font-semibold">Настройки управления рисками</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Контролируйте риски и защитите свой капитал
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Макс. открытых позиций</Label>
                      <span className="text-sm font-mono text-muted-foreground">{riskConfig.maxPositions}</span>
                    </div>
                    <Slider
                      value={[riskConfig.maxPositions]}
                      onValueChange={(val) => setRiskConfig({...riskConfig, maxPositions: val[0]})}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Максимальное плечо</Label>
                      <span className="text-sm font-mono text-muted-foreground">{riskConfig.maxLeverage}x</span>
                    </div>
                    <Slider
                      value={[riskConfig.maxLeverage]}
                      onValueChange={(val) => setRiskConfig({...riskConfig, maxLeverage: val[0]})}
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Риск портфеля (%)</Label>
                      <span className="text-sm font-mono text-muted-foreground">{riskConfig.portfolioRisk}%</span>
                    </div>
                    <Slider
                      value={[riskConfig.portfolioRisk]}
                      onValueChange={(val) => setRiskConfig({...riskConfig, portfolioRisk: val[0]})}
                      min={5}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Максимальный риск портфеля
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Дневной лимит убытков (USDT)</Label>
                    <Input
                      type="number"
                      value={riskConfig.dailyLossLimit}
                      onChange={(e) => setRiskConfig({...riskConfig, dailyLossLimit: parseInt(e.target.value)})}
                      step="50"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Бот останавливает торговлю при превышении этой суммы
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-card border-border">
                <CardContent className="pt-4 text-center">
                  <Icon name="Shield" size={24} className="mx-auto mb-2 text-success" />
                  <p className="text-xs text-muted-foreground">Защищенный капитал</p>
                  <p className="text-lg font-bold font-mono mt-1">$19,664</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-4 text-center">
                  <Icon name="TrendingUp" size={24} className="mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Под риском</p>
                  <p className="text-lg font-bold font-mono mt-1">$4,916</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-4 text-center">
                  <Icon name="AlertCircle" size={24} className="mx-auto mb-2 text-destructive" />
                  <p className="text-xs text-muted-foreground">Макс. просадка</p>
                  <p className="text-lg font-bold font-mono mt-1">-$500</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
            ) : (
              <Icon name="Save" size={16} className="mr-2" />
            )}
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}