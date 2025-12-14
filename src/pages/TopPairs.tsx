import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TopPair {
  symbol: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  volatility: {
    value: number;
    score: number;
    level: string;
  };
  liquidity: {
    volume24h: number;
    turnover24h: number;
    score: number;
    level: string;
  };
  trend: {
    direction: string;
    strength: number;
    score: number;
  };
  reliability: {
    score: number;
    level: string;
  };
  totalScore: number;
  recommendation: string;
}

interface TopPairsResponse {
  success: boolean;
  topPairs: TopPair[];
  totalPairs: number;
}

export default function TopPairs() {
  const [pairs, setPairs] = useState<TopPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<TopPair | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTopPairs();
  }, []);

  const loadTopPairs = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://functions.poehali.dev/79d0e27c-f6b2-4735-b88a-9e3fa48e6c4a');
      const data: TopPairsResponse = await response.json();
      
      if (data.success) {
        setPairs(data.topPairs.slice(0, 20));
      } else {
        setError('Не удалось загрузить данные');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationBadge = (recommendation: string) => {
    const variants = {
      excellent: { text: 'Отлично', variant: 'default' as const },
      good: { text: 'Хорошо', variant: 'secondary' as const },
      moderate: { text: 'Средне', variant: 'outline' as const },
      avoid: { text: 'Избегать', variant: 'destructive' as const },
    };
    
    const config = variants[recommendation as keyof typeof variants] || variants.moderate;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-500';
      case 'optimal': return 'text-blue-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'uptrend': return <Icon name="TrendingUp" className="text-green-500" size={16} />;
      case 'downtrend': return <Icon name="TrendingDown" className="text-red-500" size={16} />;
      default: return <Icon name="Minus" className="text-gray-500" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-muted-foreground">Анализируем рынок...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <Icon name="AlertCircle" className="text-destructive mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold mb-2">Ошибка</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadTopPairs}>
              <Icon name="RotateCw" className="mr-2" size={16} />
              Попробовать снова
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Лучшие пары для трейдинга</h1>
              <p className="text-muted-foreground">
                Автоматический анализ по волатильности, ликвидности и надёжности рынка
              </p>
            </div>
            <Button onClick={loadTopPairs} variant="outline">
              <Icon name="RotateCw" className="mr-2" size={16} />
              Обновить
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {pairs.map((pair, index) => (
            <Card 
              key={pair.symbol} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedPair(pair);
                setActionDialogOpen(true);
              }}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Ранг и символ */}
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{pair.symbol.replace('USDT', '')}</p>
                      <p className="text-xs text-muted-foreground">USDT</p>
                    </div>
                  </div>
                </div>

                {/* Цена и изменение */}
                <div className="col-span-2">
                  <p className="font-mono font-bold">${pair.price.toFixed(4)}</p>
                  <p className={`text-sm ${pair.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {pair.priceChange24h >= 0 ? '+' : ''}{pair.priceChange24h.toFixed(2)}%
                  </p>
                </div>

                {/* Общий скор */}
                <div className="col-span-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{pair.totalScore}</p>
                    <p className="text-xs text-muted-foreground">Общий балл</p>
                  </div>
                </div>

                {/* Метрики */}
                <div className="col-span-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Icon name="Activity" size={14} />
                      <span className="text-muted-foreground">Волатильность:</span>
                    </div>
                    <p className={`font-semibold ${getLevelColor(pair.volatility.level)}`}>
                      {pair.volatility.value.toFixed(2)}% ({pair.volatility.score.toFixed(0)})
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Icon name="Droplets" size={14} />
                      <span className="text-muted-foreground">Ликвидность:</span>
                    </div>
                    <p className={`font-semibold ${getLevelColor(pair.liquidity.level)}`}>
                      ${(pair.liquidity.turnover24h / 1e6).toFixed(1)}M ({pair.liquidity.score.toFixed(0)})
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {getTrendIcon(pair.trend.direction)}
                      <span className="text-muted-foreground">Тренд:</span>
                    </div>
                    <p className="font-semibold">
                      {pair.trend.direction === 'uptrend' ? 'Рост' : pair.trend.direction === 'downtrend' ? 'Падение' : 'Боковик'} ({pair.trend.score.toFixed(0)})
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Icon name="Shield" size={14} />
                      <span className="text-muted-foreground">Надёжность:</span>
                    </div>
                    <p className={`font-semibold ${getLevelColor(pair.reliability.level)}`}>
                      {pair.reliability.score.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Рекомендация */}
                <div className="col-span-2 text-right">
                  {getRecommendationBadge(pair.recommendation)}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Диалог действий с парой */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedPair?.symbol.replace('USDT', '/USDT')}
              </DialogTitle>
              <DialogDescription>
                Общий балл: {selectedPair?.totalScore} | {' '}
                {selectedPair && getRecommendationBadge(selectedPair.recommendation)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  if (selectedPair) {
                    window.parent.postMessage(
                      { 
                        type: 'addToWatchlist', 
                        symbol: selectedPair.symbol 
                      }, 
                      '*'
                    );
                    toast.success(`${selectedPair.symbol} добавлен в избранное`);
                    setActionDialogOpen(false);
                  }
                }}
                disabled={actionLoading}
              >
                <Icon name="Star" size={18} className="mr-3" />
                Добавить в избранное
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  if (selectedPair) {
                    window.parent.postMessage(
                      { 
                        type: 'createBot', 
                        symbol: selectedPair.symbol 
                      }, 
                      '*'
                    );
                    toast.success(`Создаю бота для ${selectedPair.symbol}`);
                    setActionDialogOpen(false);
                  }
                }}
                disabled={actionLoading}
              >
                <Icon name="Bot" size={18} className="mr-3" />
                Создать бота для пары
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  if (selectedPair) {
                    window.parent.postMessage(
                      { 
                        type: 'runAutoTrading', 
                        symbol: selectedPair.symbol 
                      }, 
                      '*'
                    );
                    toast.success('Запускаю автотрейдинг...');
                    setActionDialogOpen(false);
                  }
                }}
                disabled={actionLoading}
              >
                <Icon name="Play" size={18} className="mr-3" />
                Запустить автотрейдинг
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  if (selectedPair) {
                    window.parent.postMessage(
                      { 
                        type: 'runBacktest', 
                        symbol: selectedPair.symbol 
                      }, 
                      '*'
                    );
                    toast.success('Запускаю бэктест...');
                    setActionDialogOpen(false);
                  }
                }}
                disabled={actionLoading}
              >
                <Icon name="BarChart3" size={18} className="mr-3" />
                Провести анализ бэктеста
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  if (selectedPair) {
                    window.parent.postMessage(
                      { 
                        type: 'askAssistant', 
                        symbol: selectedPair.symbol,
                        question: `Расскажи про пару ${selectedPair.symbol.replace('USDT', '/USDT')} - стоит ли торговать, какие риски?`
                      }, 
                      '*'
                    );
                    toast.success('Спрашиваю у ассистента...');
                    setActionDialogOpen(false);
                  }
                }}
                disabled={actionLoading}
              >
                <Icon name="MessageCircle" size={18} className="mr-3" />
                Задать вопрос ассистенту
              </Button>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Волатильность</p>
                  <p className="font-semibold">{selectedPair?.volatility.value.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ликвидность</p>
                  <p className="font-semibold">${(selectedPair?.liquidity.turnover24h ?? 0 / 1e6).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Тренд</p>
                  <p className="font-semibold">
                    {selectedPair?.trend.direction === 'uptrend' ? 'Рост' : selectedPair?.trend.direction === 'downtrend' ? 'Падение' : 'Боковик'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Надёжность</p>
                  <p className="font-semibold">{selectedPair?.reliability.score.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}