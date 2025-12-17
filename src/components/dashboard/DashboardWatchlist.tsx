import { useState } from 'react';
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
  onSymbolMoveToFirst: (symbol: string) => void;
  onReorderWatchlist: (newOrder: WatchlistItem[]) => void;
  selectedSymbol: string;
}

export default function DashboardWatchlist({
  watchlist,
  onSymbolSelect,
  onSymbolMoveToFirst,
  onReorderWatchlist,
  selectedSymbol
}: DashboardWatchlistProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDoubleClick = (symbol: string) => {
    onSymbolMoveToFirst(symbol);
    onSymbolSelect(symbol);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newWatchlist = [...watchlist];
    const draggedItem = newWatchlist[draggedIndex];
    newWatchlist.splice(draggedIndex, 1);
    newWatchlist.splice(dropIndex, 0, draggedItem);
    
    onReorderWatchlist(newWatchlist);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-2">
        <ScrollArea className="w-full">
          <div className="flex items-center space-x-1.5">
            {watchlist.map((item, index) => (
              <div 
                key={item.symbol}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onSymbolSelect(item.symbol)}
                onDoubleClick={() => handleDoubleClick(item.symbol)}
                className={`flex-shrink-0 p-1.5 rounded-md border transition-all cursor-move min-w-[110px] ${
                  draggedIndex === index ? 'opacity-40' : ''
                } ${
                  dragOverIndex === index ? 'border-primary border-2 scale-105' : ''
                } ${
                  selectedSymbol === item.symbol 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-secondary/50 border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-[11px]">{item.symbol.replace('USDT', '/USDT')}</span>
                  <Badge 
                    variant={item.signal === 'buy' ? 'default' : item.signal === 'sell' ? 'destructive' : 'secondary'}
                    className="text-[8px] px-1 py-0 h-3"
                  >
                    {item.signal === 'buy' ? '↑' : item.signal === 'sell' ? '↓' : '—'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono font-semibold">${item.price.toLocaleString()}</span>
                  <span className={`font-medium ${item.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}