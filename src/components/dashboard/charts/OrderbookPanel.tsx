import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import QuickOrderModal from '@/components/QuickOrderModal';

interface OrderbookEntry {
  price: number;
  bidSize: number;
  askSize: number;
}

interface OrderbookPanelProps {
  orderbook: OrderbookEntry[];
  symbol: string;
}

export default function OrderbookPanel({ orderbook, symbol }: OrderbookPanelProps) {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');

  const handlePriceClick = (price: number, type: 'buy' | 'sell') => {
    setSelectedPrice(price);
    setOrderType(type);
    setOrderModalOpen(true);
  };

  if (orderbook.length === 0) {
    return (
      <Card className="bg-card border-border h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Стакан</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <Icon name="BookOpen" size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Загрузка...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const asks = orderbook.filter(o => o.askSize > 0).sort((a, b) => b.price - a.price).slice(0, 15);
  const bids = orderbook.filter(o => o.bidSize > 0).sort((a, b) => b.price - a.price).slice(0, 15);
  
  const maxSize = Math.max(
    ...asks.map(o => o.askSize),
    ...bids.map(o => o.bidSize),
    1
  );

  const spreadPrice = asks.length > 0 && bids.length > 0 ? asks[asks.length - 1].price - bids[0].price : 0;
  const spreadPercent = asks.length > 0 && bids.length > 0 ? (spreadPrice / bids[0].price) * 100 : 0;

  return (
    <>
      <QuickOrderModal
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        price={selectedPrice}
        symbol={symbol}
        orderType={orderType}
      />
      
      <Card className="bg-card border-border flex flex-col" style={{ height: '300px' }}>
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Стакан</CardTitle>
            <div className="text-[10px] text-muted-foreground">
              Клик = ордер
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-0 px-3 pb-3">
          <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold text-muted-foreground px-1 py-2 border-b border-border">
            <div className="text-left">Цена</div>
            <div className="text-right">Объём</div>
            <div className="text-right">Сумма</div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-[1px] py-1">
            {asks.map((order, idx) => {
              const percent = (order.askSize / maxSize) * 100;
              const cumulative = asks.slice(idx).reduce((sum, o) => sum + o.askSize, 0);
              
              return (
                <div 
                  key={`ask-${idx}`} 
                  className="relative h-5 flex items-center hover:bg-destructive/10 transition-colors cursor-pointer rounded-sm"
                  onClick={() => handlePriceClick(order.price, 'sell')}
                >
                  <div 
                    className="absolute right-0 top-0 h-full bg-destructive/20"
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative z-10 grid grid-cols-3 gap-1 w-full px-1 text-[11px] font-mono">
                    <div className="text-destructive font-semibold">
                      {order.price.toFixed(2)}
                    </div>
                    <div className="text-right text-foreground/80">
                      {order.askSize.toFixed(3)}
                    </div>
                    <div className="text-right text-muted-foreground text-[10px]">
                      {cumulative.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {spreadPrice > 0 && (
            <div className="flex items-center justify-center py-1.5 my-1 bg-secondary/50 rounded border border-border flex-shrink-0">
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground">Спред</div>
                <div className="text-xs font-mono font-semibold">
                  {spreadPrice.toFixed(2)} <span className="text-[9px] text-muted-foreground">({spreadPercent.toFixed(3)}%)</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-[1px] py-1">
            {bids.map((order, idx) => {
              const percent = (order.bidSize / maxSize) * 100;
              const cumulative = bids.slice(0, idx + 1).reduce((sum, o) => sum + o.bidSize, 0);
              
              return (
                <div 
                  key={`bid-${idx}`} 
                  className="relative h-5 flex items-center hover:bg-success/10 transition-colors cursor-pointer rounded-sm"
                  onClick={() => handlePriceClick(order.price, 'buy')}
                >
                  <div 
                    className="absolute right-0 top-0 h-full bg-success/20"
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative z-10 grid grid-cols-3 gap-1 w-full px-1 text-[11px] font-mono">
                    <div className="text-success font-semibold">
                      {order.price.toFixed(2)}
                    </div>
                    <div className="text-right text-foreground/80">
                      {order.bidSize.toFixed(3)}
                    </div>
                    <div className="text-right text-muted-foreground text-[10px]">
                      {cumulative.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}