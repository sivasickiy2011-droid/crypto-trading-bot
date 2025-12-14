import { CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface PriceChartHeaderProps {
  selectedSymbol: string;
  currentPrice: number;
  marketType: 'spot' | 'futures';
  setMarketType: (type: 'spot' | 'futures') => void;
  activeTimeframe: string;
  onTimeframeChange: (tf: string) => void;
  chartType: 'line' | 'candle';
  setChartType: (type: 'line' | 'candle') => void;
  showIndicators: {
    ema9: boolean;
    ema21: boolean;
    ema50: boolean;
    rsi: boolean;
    bb: boolean;
    macd: boolean;
  };
  setShowIndicators: React.Dispatch<React.SetStateAction<{
    ema9: boolean;
    ema21: boolean;
    ema50: boolean;
    rsi: boolean;
    bb: boolean;
    macd: boolean;
  }>>;
}

const timeframes = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' }
];

export default function PriceChartHeader({
  selectedSymbol,
  currentPrice,
  marketType,
  setMarketType,
  activeTimeframe,
  onTimeframeChange,
  chartType,
  setChartType,
  showIndicators,
  setShowIndicators
}: PriceChartHeaderProps) {
  const priceChange = currentPrice > 0 ? ((currentPrice - 3000) / 3000) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-base font-semibold">{selectedSymbol}</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              Бессрочный
            </Badge>
          </div>
          <div className="flex flex-col">
            <div className={`text-2xl font-bold font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {currentPrice > 0 ? currentPrice.toFixed(2) : '—'}
            </div>
            <div className={`text-xs font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
          >
            <Icon name="Settings2" size={14} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {timeframes.map(tf => (
            <Button
              key={tf.value}
              variant={activeTimeframe === tf.value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs font-medium"
              onClick={() => onTimeframeChange(tf.value)}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              variant={chartType === 'candle' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setChartType('candle')}
            >
              <Icon name="BarChart4" size={14} />
            </Button>
            <Button
              variant={chartType === 'line' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setChartType('line')}
            >
              <Icon name="TrendingUp" size={14} />
            </Button>
          </div>

          <div className="flex items-center space-x-1 border-l border-border pl-2">
            <Button
              variant={showIndicators.ema9 ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowIndicators(prev => ({ ...prev, ema9: !prev.ema9 }))}
            >
              EMA9
            </Button>
            <Button
              variant={showIndicators.ema21 ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowIndicators(prev => ({ ...prev, ema21: !prev.ema21 }))}
            >
              EMA21
            </Button>
            <Button
              variant={showIndicators.bb ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowIndicators(prev => ({ ...prev, bb: !prev.bb }))}
            >
              BB
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}