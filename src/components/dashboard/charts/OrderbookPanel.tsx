import { useState, useMemo } from 'react';
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

  // useMemo должен быть вызван ВСЕГДА, до любого условного return
  const { asks, bids, maxSize, spreadPrice, spreadPercent, bestAskPrice } = useMemo(() => {
    const asksData = orderbook.filter(o => o.askSize > 0).sort((a, b) => a.price - b.price).slice(0, 20);
    const bidsData = orderbook.filter(o => o.bidSize > 0).sort((a, b) => b.price - a.price).slice(0, 20);
    
    const maxSizeValue = Math.max(
      ...asksData.map(o => o.askSize),
      ...bidsData.map(o => o.bidSize),
      1
    );

    const spreadPriceValue = asksData.length > 0 && bidsData.length > 0 ? asksData[asksData.length - 1].price - bidsData[0].price : 0;
    const spreadPercentValue = asksData.length > 0 && bidsData.length > 0 ? (spreadPriceValue / bidsData[0].price) * 100 : 0;
    const bestAskPriceValue = asksData.length > 0 ? asksData[asksData.length - 1].price : 0;

    return {
      asks: asksData,
      bids: bidsData,
      maxSize: maxSizeValue,
      spreadPrice: spreadPriceValue,
      spreadPercent: spreadPercentValue,
      bestAskPrice: bestAskPriceValue
    };
  }, [orderbook]);

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

  return (
    <>
      <QuickOrderModal
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        price={selectedPrice}
        symbol={symbol}
        orderType={orderType}
      />
      
      <Card className="bg-black/90 border-zinc-800 flex flex-col" style={{ height: '545px' }}>
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white">Стакан ордеров</CardTitle>
            <div className="text-[10px] text-zinc-500">
              0.01
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-0 px-3 pb-3 bg-black/50">
          <div className="grid grid-cols-3 gap-1 text-[10px] font-medium text-zinc-500 px-1 py-2 border-b border-zinc-800/50">
            <div className="text-left">Цена(USDT)</div>
            <div className="text-right">Кол-во</div>
            <div className="text-right">Сумма</div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-[1px] py-1">
            {asks.map((order, idx) => {
              const percent = (order.askSize / maxSize) * 100;
              const cumulative = asks.slice(idx).reduce((sum, o) => sum + o.askSize, 0);
              
              return (
                <div 
                  key={`ask-${order.price}-${idx}`} 
                  className="relative h-5 flex items-center hover:bg-red-500/5 transition-colors cursor-pointer"
                  onClick={() => handlePriceClick(order.price, 'sell')}
                >
                  <div 
                    className="absolute right-0 top-0 h-full bg-red-500/10 transition-all duration-200"
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative z-10 grid grid-cols-3 gap-1 w-full px-1 text-[11px] font-mono">
                    <div className="text-red-400 font-medium">
                      {order.price.toFixed(4)}
                    </div>
                    <div className="text-right text-zinc-400">
                      {order.askSize.toFixed(3)}
                    </div>
                    <div className="text-right text-zinc-600 text-[10px]">
                      {cumulative.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {spreadPrice > 0 && (
            <div className="flex items-center justify-center py-2 my-1 bg-zinc-900/50 flex-shrink-0">
              <div className="text-center">
                <div className="text-lg font-mono font-bold text-red-400">
                  {bestAskPrice.toFixed(4)}
                </div>
                <div className="text-[9px] text-zinc-600 mt-0.5">
                  ↕ {spreadPrice.toFixed(4)} ({spreadPercent.toFixed(3)}%)
                </div>
                <div className="text-lg font-mono font-bold text-green-400 mt-1">
                  {bids[0].price.toFixed(4)}
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
                  key={`bid-${order.price}-${idx}`} 
                  className="relative h-5 flex items-center hover:bg-green-500/5 transition-colors cursor-pointer"
                  onClick={() => handlePriceClick(order.price, 'buy')}
                >
                  <div 
                    className="absolute right-0 top-0 h-full bg-green-500/10 transition-all duration-200"
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative z-10 grid grid-cols-3 gap-1 w-full px-1 text-[11px] font-mono">
                    <div className="text-green-400 font-medium">
                      {order.price.toFixed(4)}
                    </div>
                    <div className="text-right text-zinc-400">
                      {order.bidSize.toFixed(3)}
                    </div>
                    <div className="text-right text-zinc-600 text-[10px]">
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