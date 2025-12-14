import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TopPair } from './TopPairCard';

interface TopPairActionDialogProps {
  pair: TopPair | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLoading: boolean;
}

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

export default function TopPairActionDialog({ pair, open, onOpenChange, actionLoading }: TopPairActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {pair?.symbol.replace('USDT', '/USDT')}
          </DialogTitle>
          <DialogDescription>
            Общий балл: {pair?.totalScore} | {' '}
            {pair && getRecommendationBadge(pair.recommendation)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => {
              if (pair) {
                window.parent.postMessage(
                  { 
                    type: 'addToWatchlist', 
                    symbol: pair.symbol 
                  }, 
                  '*'
                );
                toast.success(`${pair.symbol} добавлен в избранное`);
                onOpenChange(false);
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
              if (pair) {
                window.parent.postMessage(
                  { 
                    type: 'createBot', 
                    symbol: pair.symbol 
                  }, 
                  '*'
                );
                toast.success(`Создаю бота для ${pair.symbol}`);
                onOpenChange(false);
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
              if (pair) {
                window.parent.postMessage(
                  { 
                    type: 'runAutoTrading', 
                    symbol: pair.symbol 
                  }, 
                  '*'
                );
                toast.success('Запускаю автотрейдинг...');
                onOpenChange(false);
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
              if (pair) {
                window.parent.postMessage(
                  { 
                    type: 'runBacktest', 
                    symbol: pair.symbol 
                  }, 
                  '*'
                );
                toast.success('Запускаю бэктест...');
                onOpenChange(false);
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
              if (pair) {
                window.parent.postMessage(
                  { 
                    type: 'askAssistant', 
                    symbol: pair.symbol,
                    question: `Расскажи про пару ${pair.symbol.replace('USDT', '/USDT')} - стоит ли торговать, какие риски?`
                  }, 
                  '*'
                );
                toast.success('Спрашиваю у ассистента...');
                onOpenChange(false);
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
              <p className="font-semibold">{pair?.volatility.value.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ликвидность</p>
              <p className="font-semibold">${(pair?.liquidity.turnover24h ?? 0 / 1e6).toFixed(1)}M</p>
            </div>
            <div>
              <p className="text-muted-foreground">Тренд</p>
              <p className="font-semibold">
                {pair?.trend.direction === 'uptrend' ? 'Рост' : pair?.trend.direction === 'downtrend' ? 'Падение' : 'Боковик'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Надёжность</p>
              <p className="font-semibold">{pair?.reliability.score.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
