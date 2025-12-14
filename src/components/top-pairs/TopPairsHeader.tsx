import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface TopPairsHeaderProps {
  viewMode: 'favorites' | 'top10' | 'top20';
  favoritesCount: number;
  onViewModeChange: (mode: 'favorites' | 'top10' | 'top20') => void;
  onRefresh: () => void;
}

export default function TopPairsHeader({ viewMode, favoritesCount, onViewModeChange, onRefresh }: TopPairsHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Лучшие пары для трейдинга</h1>
          <p className="text-muted-foreground">
            Автоматический анализ по волатильности, ликвидности и надёжности рынка
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'favorites' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('favorites')}
          >
            <Icon name="Star" className="mr-2" size={16} />
            Избранные ({favoritesCount})
          </Button>
          <Button 
            variant={viewMode === 'top10' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('top10')}
          >
            Топ-10
          </Button>
          <Button 
            variant={viewMode === 'top20' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('top20')}
          >
            Топ-20
          </Button>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <Icon name="RotateCw" className="mr-2" size={16} />
            Обновить
          </Button>
        </div>
      </div>
    </div>
  );
}
