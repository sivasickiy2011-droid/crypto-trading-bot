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
  const maxBidSize = Math.max(...orderbook.map(o => o.bidSize), 1);
  const maxAskSize = Math.max(...orderbook.map(o => o.askSize), 1);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base">Стакан ордеров</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-px">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2 pb-2 border-b border-border">
            <div className="flex-1 text-right pr-2">Bid</div>
            <div className="w-24 text-center">Цена</div>
            <div className="flex-1 text-left pl-2">Ask</div>
          </div>
          {orderbook.slice(0, 20).map((order, idx) => {
            const totalSize = order.askSize + order.bidSize;
            const isLargeOrder = totalSize > (maxBidSize + maxAskSize) * 0.3;
            const bidPercent = (order.bidSize / maxBidSize) * 100;
            const askPercent = (order.askSize / maxAskSize) * 100;
            
            return (
              <div key={idx} className="flex items-center justify-between text-xs font-mono hover:bg-secondary/50 transition-colors">
                <div className="flex-1 relative h-6">
                  <div 
                    className="absolute right-0 top-0 h-full bg-success/15"
                    style={{ width: `${bidPercent}%` }}
                  />
                  <div className={`relative z-10 text-right pr-2 py-1 ${isLargeOrder ? 'text-success font-semibold' : 'text-success/70'}`}>
                    {order.bidSize > 0 ? order.bidSize.toFixed(4) : ''}
                  </div>
                </div>
                <div className="w-24 text-center font-semibold text-foreground py-1">
                  {order.price.toFixed(2)}
                </div>
                <div className="flex-1 relative h-6">
                  <div 
                    className="absolute left-0 top-0 h-full bg-destructive/15"
                    style={{ width: `${askPercent}%` }}
                  />
                  <div className={`relative z-10 text-left pl-2 py-1 ${isLargeOrder ? 'text-destructive font-semibold' : 'text-destructive/70'}`}>
                    {order.askSize > 0 ? order.askSize.toFixed(4) : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {orderbook.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Icon name="BookOpen" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Загрузка стакана...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
