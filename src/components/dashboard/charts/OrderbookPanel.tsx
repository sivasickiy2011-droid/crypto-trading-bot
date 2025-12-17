import { useState, useMemo, useEffect, useRef } from 'react';
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
  const asksScrollRef = useRef<HTMLDivElement>(null);

  const handlePriceClick = (price: number, type: 'buy' | 'sell') => {
    setSelectedPrice(price);
    setOrderType(type);
    setOrderModalOpen(true);
  };

  // useMemo должен быть вызван ВСЕГДА, до любого условного return
  const { asks, bids, maxSize, spreadPrice, spreadPercent, bestAskPrice, bestBidPrice, bestAskVolume, bestBidVolume } = useMemo(() => {
    const asksData = orderbook.filter(o => o.askSize > 0).sort((a, b) => b.price - a.price).slice(0, 20);
    const bidsData = orderbook.filter(o => o.bidSize > 0).sort((a, b) => b.price - a.price).slice(0, 20);
    
    const maxSizeValue = Math.max(
      ...asksData.map(o => o.askSize),
      ...bidsData.map(o => o.bidSize),
      1
    );

    const spreadPriceValue = asksData.length > 0 && bidsData.length > 0 ? asksData[0].price - bidsData[0].price : 0;
    const spreadPercentValue = asksData.length > 0 && bidsData.length > 0 ? (spreadPriceValue / bidsData[0].price) * 100 : 0;
    const bestAskPriceValue = asksData.length > 0 ? asksData[0].price : 0;
    const bestBidPriceValue = bidsData.length > 0 ? bidsData[0].price : 0;
    const bestAskVolumeValue = asksData.length > 0 ? asksData[0].askSize : 0;
    const bestBidVolumeValue = bidsData.length > 0 ? bidsData[0].bidSize : 0;

    return {
      asks: asksData,
      bids: bidsData,
      maxSize: maxSizeValue,
      spreadPrice: spreadPriceValue,
      spreadPercent: spreadPercentValue,
      bestAskPrice: bestAskPriceValue,
      bestBidPrice: bestBidPriceValue,
      bestAskVolume: bestAskVolumeValue,
      bestBidVolume: bestBidVolumeValue
    };
  }, [orderbook]);

  useEffect(() => {
    if (asksScrollRef.current) {
      asksScrollRef.current.scrollTop = asksScrollRef.current.scrollHeight;
    }
  }, [asks]);

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
      
      <div className="flex-1 overflow-hidden flex flex-col p-0 px-3 pb-3 bg-black/50 rounded-md">
          <style>{`
            .orderbook-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .orderbook-scroll::-webkit-scrollbar-track {
              background: #000;
              border: 1px solid #27272a;
              border-radius: 4px;
            }
            .orderbook-scroll::-webkit-scrollbar-thumb {
              background: #fff;
              border-radius: 4px;
              border: 1px solid #27272a;
            }
            .orderbook-scroll::-webkit-scrollbar-thumb:hover {
              background: #e4e4e7;
            }
            .orderbook-scroll::-webkit-scrollbar-button {
              background: #27272a;
              height: 12px;
              border: 1px solid #18181b;
            }
            .orderbook-scroll::-webkit-scrollbar-button:vertical:decrement {
              border-radius: 4px 4px 0 0;
            }
            .orderbook-scroll::-webkit-scrollbar-button:vertical:increment {
              border-radius: 0 0 4px 4px;
            }
          `}</style>
          <div className="grid grid-cols-3 gap-1 text-[10px] font-medium text-zinc-500 px-1 py-2 border-b border-zinc-800/50">
            <div className="text-left">Цена(USDT)</div>
            <div className="text-right">Кол-во</div>
            <div className="text-right">Сумма</div>
          </div>

          <div ref={asksScrollRef} className="flex-1 overflow-y-auto space-y-[1px] py-1 orderbook-scroll">
            {asks.map((order, idx) => {
              const percent = (order.askSize / maxSize) * 100;
              const cumulative = asks.slice(idx).reduce((sum, o) => sum + o.askSize, 0);
              const isBestAsk = idx === 0;
              
              return (
                <div 
                  key={`ask-${order.price}-${idx}`} 
                  className={`relative h-5 flex items-center hover:bg-red-500/5 transition-colors cursor-pointer ${isBestAsk ? 'ring-1 ring-red-500/40 rounded-sm' : ''}`}
                  onClick={() => handlePriceClick(order.price, 'sell')}
                >
                  <div 
                    className={`absolute right-0 top-0 h-full transition-all duration-200 ${isBestAsk ? 'bg-red-500/20' : 'bg-red-500/10'}`}
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative z-10 grid grid-cols-3 gap-1 w-full px-1 text-[11px] font-mono">
                    <div className={`font-medium ${isBestAsk ? 'text-red-300' : 'text-red-400'}`}>
                      {order.price.toFixed(6)}
                    </div>
                    <div className={`text-right ${isBestAsk ? 'text-zinc-300 font-semibold' : 'text-zinc-400'}`}>
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
                  {bestAskPrice.toFixed(6)}
                </div>
                <div className="text-[9px] text-zinc-600 mt-0.5">
                  ↕ {spreadPrice.toFixed(6)} ({spreadPercent.toFixed(3)}%)
                </div>
                <div className="text-lg font-mono font-bold text-green-400 mt-1">
                  {bids[0].price.toFixed(6)}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-[1px] py-1 orderbook-scroll">
            {bids.map((order, idx) => {
              const percent = (order.bidSize / maxSize) * 100;
              const cumulative = bids.slice(0, idx + 1).reduce((sum, o) => sum + o.bidSize, 0);
              const isBestBid = idx === 0;
              
              return (
                <div 
                  key={`bid-${order.price}-${idx}`} 
                  className={`relative h-5 flex items-center hover:bg-green-500/5 transition-colors cursor-pointer ${isBestBid ? 'ring-1 ring-green-500/40 rounded-sm' : ''}`}
                  onClick={() => handlePriceClick(order.price, 'buy')}
                >
                  <div 
                    className={`absolute right-0 top-0 h-full transition-all duration-200 ${isBestBid ? 'bg-green-500/20' : 'bg-green-500/10'}`}
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative z-10 grid grid-cols-3 gap-1 w-full px-1 text-[11px] font-mono">
                    <div className={`font-medium ${isBestBid ? 'text-green-300' : 'text-green-400'}`}>
                      {order.price.toFixed(6)}
                    </div>
                    <div className={`text-right ${isBestBid ? 'text-zinc-300 font-semibold' : 'text-zinc-400'}`}>
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
        </div>
    </>
  );
}