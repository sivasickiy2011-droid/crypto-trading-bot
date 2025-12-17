import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import TopPairsHeader from './TopPairsHeader';
import TopPairCard, { TopPair } from './TopPairCard';
import { toast } from 'sonner';

interface TopPairsResponse {
  success: boolean;
  topPairs: TopPair[];
  totalPairs: number;
}

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  volume: string;
  signal: string;
}

interface TopPairsIntegratedProps {
  watchlist: WatchlistItem[];
  onAddToWatchlist: (symbol: string) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
  onSelectPair: (symbol: string) => void;
}

export default function TopPairsIntegrated({ watchlist, onAddToWatchlist, onRemoveFromWatchlist, onSelectPair }: TopPairsIntegratedProps) {
  const [pairs, setPairs] = useState<TopPair[]>([]);
  const [allPairs, setAllPairs] = useState<TopPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'favorites' | 'top10' | 'top20'>(() => {
    return (localStorage.getItem('top_pairs_view_mode') as 'favorites' | 'top10' | 'top20') || 'top10';
  });

  const favoriteSymbols = watchlist.map(w => w.symbol);

  useEffect(() => {
    loadTopPairs();
  }, []);

  useEffect(() => {
    localStorage.setItem('top_pairs_view_mode', viewMode);
    filterPairs();
  }, [viewMode, allPairs, favoriteSymbols.length]);

  const loadTopPairs = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://function.centerai.tech/api/pair-analyzer');
      const data: TopPairsResponse = await response.json();
      
      if (data.success) {
        setAllPairs(data.topPairs.slice(0, 20));
      } else {
        setError('Не удалось загрузить данные');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (symbol: string) => {
    if (favoriteSymbols.includes(symbol)) {
      onRemoveFromWatchlist(symbol);
      toast.success(`${symbol} удалён из избранного`);
    } else {
      onAddToWatchlist(symbol);
      toast.success(`${symbol} добавлен в избранное`);
    }
  };

  const filterPairs = () => {
    if (viewMode === 'favorites') {
      setPairs(allPairs.filter(p => favoriteSymbols.includes(p.symbol)));
    } else if (viewMode === 'top10') {
      setPairs(allPairs.slice(0, 10));
    } else {
      setPairs(allPairs.slice(0, 20));
    }
  };

  const handlePairSelect = (pair: TopPair) => {
    if (!favoriteSymbols.includes(pair.symbol)) {
      onAddToWatchlist(pair.symbol);
    }
    onSelectPair(pair.symbol);
    toast.success(`Открываю график ${pair.symbol}`);
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-muted-foreground">Анализируем рынок...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center">
          <Icon name="AlertCircle" className="text-destructive mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">Ошибка</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadTopPairs}>
            <Icon name="RotateCw" className="mr-2" size={16} />
            Попробовать снова
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <TopPairsHeader
        viewMode={viewMode}
        favoritesCount={favoriteSymbols.length}
        onViewModeChange={setViewMode}
        onRefresh={loadTopPairs}
      />

      <div className="space-y-4">
        {pairs.length === 0 && viewMode === 'favorites' ? (
          <Card className="p-12 text-center">
            <Icon name="Star" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">Нет избранных пар</h3>
            <p className="text-muted-foreground mb-4">
              Нажми на звездочку возле любой пары, чтобы добавить её в избранное
            </p>
            <Button onClick={() => setViewMode('top10')}>
              Посмотреть топ-10
            </Button>
          </Card>
        ) : (
          pairs.map((pair, index) => (
            <TopPairCard
              key={pair.symbol}
              pair={pair}
              index={index}
              isFavorite={favoriteSymbols.includes(pair.symbol)}
              onToggleFavorite={toggleFavorite}
              onSelect={handlePairSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}