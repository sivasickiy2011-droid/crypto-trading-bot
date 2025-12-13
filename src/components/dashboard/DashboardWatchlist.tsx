import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  volume: string;
  signal: string;
}

interface DashboardWatchlistProps {
  watchlist: WatchlistItem[];
  onSymbolSelect: (symbol: string) => void;
  selectedSymbol: string;
}

export default function DashboardWatchlist({
  watchlist,
  onSymbolSelect,
  selectedSymbol
}: DashboardWatchlistProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        <ScrollArea className="w-full">
          <div className="flex items-center space-x-2">
            {watchlist.map((item) => (
              <div 
                key={item.symbol} 
                onClick={() => onSymbolSelect(item.symbol)}
                className={`flex-shrink-0 p-2 rounded-lg border transition-all cursor-pointer min-w-[140px] ${
                  selectedSymbol === item.symbol 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-secondary/50 border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{item.symbol.replace('USDT', '/USDT')}</span>
                  <Badge 
                    variant={item.signal === 'buy' ? 'default' : item.signal === 'sell' ? 'destructive' : 'secondary'}
                    className="text-[9px] px-1.5 py-0 h-4"
                  >
                    {item.signal === 'buy' ? '↑' : item.signal === 'sell' ? '↓' : '—'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold">${item.price.toLocaleString()}</span>
                  <span className={`font-medium ${item.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Vol: {item.volume}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
