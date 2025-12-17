import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

export interface TopPair {
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

interface TopPairCardProps {
  pair: TopPair;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
  onSelect: (pair: TopPair) => void;
}

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

export default function TopPairCard({ pair, index, isFavorite, onToggleFavorite, onSelect }: TopPairCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-1 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(pair.symbol);
            }}
          >
            <Icon 
              name={isFavorite ? "Star" : "StarOff"} 
              size={20} 
              className={isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}
            />
          </Button>
        </div>
        
        <div 
          className="col-span-2 cursor-pointer"
          onClick={() => onSelect(pair)}
        >
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

        <div 
          className="col-span-2 cursor-pointer"
          onClick={() => onSelect(pair)}
        >
          <p className="font-mono font-bold">${pair.price.toFixed(4)}</p>
          <p className={`text-sm ${pair.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {pair.priceChange24h >= 0 ? '+' : ''}{pair.priceChange24h.toFixed(2)}%
          </p>
        </div>

        <div 
          className="col-span-2 cursor-pointer"
          onClick={() => onSelect(pair)}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{pair.totalScore}</p>
            <p className="text-xs text-muted-foreground">Общий балл</p>
          </div>
        </div>

        <div 
          className="col-span-3 grid grid-cols-2 gap-3 text-sm cursor-pointer"
          onClick={() => onSelect(pair)}
        >
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

        <div className="col-span-2 flex items-center justify-end gap-2">
          {getRecommendationBadge(pair.recommendation)}
          <Button
            variant="default"
            size="sm"
            onClick={() => onSelect(pair)}
            className="ml-2"
          >
            <Icon name="BarChart3" size={14} className="mr-1" />
            График
          </Button>
        </div>
      </div>
    </Card>
  );
}