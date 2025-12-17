import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import TopPairsHeader from '@/components/top-pairs/TopPairsHeader';
import TopPairCard, { TopPair } from '@/components/top-pairs/TopPairCard';
import TopPairActionDialog from '@/components/top-pairs/TopPairActionDialog';

interface TopPairsResponse {
  success: boolean;
  topPairs: TopPair[];
  totalPairs: number;
}

export default function TopPairs() {
  const [pairs, setPairs] = useState<TopPair[]>([]);
  const [allPairs, setAllPairs] = useState<TopPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<TopPair | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'favorites' | 'top10' | 'top20'>(() => {
    return (localStorage.getItem('top_pairs_view_mode') as 'favorites' | 'top10' | 'top20') || 'top10';
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('user_watchlist');
    if (saved) {
      const watchlist = JSON.parse(saved);
      return watchlist.map((item: any) => item.symbol);
    }
    return [];
  });

  useEffect(() => {
    loadTopPairs();
  }, []);

  useEffect(() => {
    localStorage.setItem('top_pairs_view_mode', viewMode);
    filterPairs();
  }, [viewMode, allPairs, favorites]);

  useEffect(() => {
    const saved = localStorage.getItem('user_watchlist');
    const currentWatchlist = saved ? JSON.parse(saved) : [];
    
    // Update watchlist based on favorites
    const newWatchlist = favorites.map(symbol => {
      const existing = currentWatchlist.find((item: any) => item.symbol === symbol);
      return existing || { symbol, price: 0, change: 0, volume: '0', signal: 'neutral' };
    });
    
    localStorage.setItem('user_watchlist', JSON.stringify(newWatchlist));
  }, [favorites]);

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
    const isCurrentlyFavorite = favorites.includes(symbol);
    
    if (isCurrentlyFavorite) {
      setFavorites(prev => prev.filter(s => s !== symbol));
      
      // Also remove from user_watchlist
      const saved = localStorage.getItem('user_watchlist');
      if (saved) {
        const watchlist = JSON.parse(saved);
        const updated = watchlist.filter((item: any) => item.symbol !== symbol);
        localStorage.setItem('user_watchlist', JSON.stringify(updated));
      }
    } else {
      setFavorites(prev => [...prev, symbol]);
      
      // Send message to parent window to add to watchlist
      window.parent.postMessage(
        { type: 'addToWatchlist', symbol }, 
        '*'
      );
    }
  };

  const filterPairs = () => {
    if (viewMode === 'favorites') {
      setPairs(allPairs.filter(p => favorites.includes(p.symbol)));
    } else if (viewMode === 'top10') {
      setPairs(allPairs.slice(0, 10));
    } else {
      setPairs(allPairs.slice(0, 20));
    }
  };

  const handlePairSelect = (pair: TopPair) => {
    setSelectedPair(pair);
    setActionDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-muted-foreground">Анализируем рынок...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 max-w-md">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <TopPairsHeader
          viewMode={viewMode}
          favoritesCount={favorites.length}
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
                isFavorite={favorites.includes(pair.symbol)}
                onToggleFavorite={toggleFavorite}
                onSelect={handlePairSelect}
              />
            ))
          )}
        </div>

        <TopPairActionDialog
          pair={selectedPair}
          open={actionDialogOpen}
          onOpenChange={setActionDialogOpen}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );
}