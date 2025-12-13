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
  { label: '1 минута', value: '1' },
  { label: '5 минут', value: '5' },
  { label: '15 минут', value: '15' },
  { label: '1 час', value: '60' },
  { label: '4 часа', value: '240' },
  { label: '1 день', value: 'D' }
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
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <CardTitle className="text-xl">{selectedSymbol}</CardTitle>
        <Badge variant="outline" className="text-xs font-mono">
          {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : '—'}
        </Badge>
        <div className="flex items-center space-x-1 border border-border rounded-md p-1">
          <Button
            variant={marketType === 'spot' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setMarketType('spot')}
          >
            Спот
          </Button>
          <Button
            variant={marketType === 'futures' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setMarketType('futures')}
          >
            Фьючерсы
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <Select value={activeTimeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeframes.map(tf => (
              <SelectItem key={tf.value} value={tf.value} className="text-xs">
                {tf.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-1 border border-border rounded-md p-1">
          <Button
            variant={chartType === 'line' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setChartType('line')}
          >
            <Icon name="TrendingUp" size={14} />
          </Button>
          <Button
            variant={chartType === 'candle' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setChartType('candle')}
          >
            <Icon name="BarChart4" size={14} />
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          <Badge 
            variant={showIndicators.ema9 ? 'default' : 'outline'}
            className="text-xs cursor-pointer h-6 px-2"
            onClick={() => setShowIndicators(prev => ({ ...prev, ema9: !prev.ema9 }))}
          >
            EMA9
          </Badge>
          <Badge 
            variant={showIndicators.ema21 ? 'default' : 'outline'}
            className="text-xs cursor-pointer h-6 px-2"
            onClick={() => setShowIndicators(prev => ({ ...prev, ema21: !prev.ema21 }))}
          >
            EMA21
          </Badge>
          <Badge 
            variant={showIndicators.ema50 ? 'default' : 'outline'}
            className="text-xs cursor-pointer h-6 px-2"
            onClick={() => setShowIndicators(prev => ({ ...prev, ema50: !prev.ema50 }))}
          >
            EMA50
          </Badge>
          <Badge 
            variant={showIndicators.rsi ? 'default' : 'outline'}
            className="text-xs cursor-pointer h-6 px-2"
            onClick={() => setShowIndicators(prev => ({ ...prev, rsi: !prev.rsi }))}
          >
            RSI
          </Badge>
          <Badge 
            variant={showIndicators.bb ? 'default' : 'outline'}
            className="text-xs cursor-pointer h-6 px-2"
            onClick={() => setShowIndicators(prev => ({ ...prev, bb: !prev.bb }))}
          >
            BB
          </Badge>
          <Badge 
            variant={showIndicators.macd ? 'default' : 'outline'}
            className="text-xs cursor-pointer h-6 px-2"
            onClick={() => setShowIndicators(prev => ({ ...prev, macd: !prev.macd }))}
          >
            MACD
          </Badge>
        </div>
      </div>
    </div>
  );
}
