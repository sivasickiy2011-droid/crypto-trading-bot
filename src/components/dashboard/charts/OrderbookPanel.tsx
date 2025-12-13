import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface OrderbookEntry {
  price: number;
  bidSize: number;
  askSize: number;
}

interface OrderbookPanelProps {
  orderbook: OrderbookEntry[];
}

export default function OrderbookPanel({ orderbook }: OrderbookPanelProps) {
  if (orderbook.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Стакан ордеров</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <Icon name="BookOpen" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Загрузка стакана...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const asks = orderbook.filter(o => o.askSize > 0).sort((a, b) => b.price - a.price).slice(0, 10);
  const bids = orderbook.filter(o => o.bidSize > 0).sort((a, b) => b.price - a.price).slice(0, 10);
  
  const maxAskSize = Math.max(...asks.map(o => o.askSize), 1);
  const maxBidSize = Math.max(...bids.map(o => o.bidSize), 1);

  const spreadPrice = asks.length > 0 && bids.length > 0 ? asks[asks.length - 1].price - bids[0].price : 0;
  const spreadPercent = asks.length > 0 && bids.length > 0 ? (spreadPrice / bids[0].price) * 100 : 0;

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Стакан ордеров</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2 pb-2 border-b border-border">
          <div className="w-28 text-left">Цена (USDT)</div>
          <div className="flex-1 text-right">Объём</div>
        </div>

        <div className="space-y-px">
          {asks.map((order, idx) => {
            const percent = (order.askSize / maxAskSize) * 100;
            const isLarge = order.askSize > maxAskSize * 0.5;
            
            return (
              <div key={`ask-${idx}`} className="flex items-center justify-between text-xs font-mono hover:bg-destructive/5 transition-colors">
                <div className="w-28 font-semibold text-destructive py-1">
                  {order.price.toFixed(2)}
                </div>
                <div className="flex-1 relative h-6">
                  <div 
                    className="absolute right-0 top-0 h-full bg-destructive/15"
                    style={{ width: `${percent}%` }}
                  />
                  <div className={`relative z-10 text-right pr-2 py-1 ${isLarge ? 'text-destructive font-semibold' : 'text-destructive/80'}`}>
                    {order.askSize.toFixed(4)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {spreadPrice > 0 && (
          <div className="flex items-center justify-center py-2 my-1 bg-secondary/50 rounded-md border border-border">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Спред</div>
              <div className="text-sm font-mono font-semibold">
                {spreadPrice.toFixed(2)} <span className="text-xs text-muted-foreground">({spreadPercent.toFixed(3)}%)</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-px">
          {bids.map((order, idx) => {
            const percent = (order.bidSize / maxBidSize) * 100;
            const isLarge = order.bidSize > maxBidSize * 0.5;
            
            return (
              <div key={`bid-${idx}`} className="flex items-center justify-between text-xs font-mono hover:bg-success/5 transition-colors">
                <div className="w-28 font-semibold text-success py-1">
                  {order.price.toFixed(2)}
                </div>
                <div className="flex-1 relative h-6">
                  <div 
                    className="absolute right-0 top-0 h-full bg-success/15"
                    style={{ width: `${percent}%` }}
                  />
                  <div className={`relative z-10 text-right pr-2 py-1 ${isLarge ? 'text-success font-semibold' : 'text-success/80'}`}>
                    {order.bidSize.toFixed(4)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
