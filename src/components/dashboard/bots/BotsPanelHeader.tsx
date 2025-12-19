import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Bot } from './useBotsManager';

interface BotsPanelHeaderProps {
  bots: Bot[];
  onMACrossoverClick: () => void;
  onCreateBotClick: () => void;
}

export default function BotsPanelHeader({ bots, onMACrossoverClick, onCreateBotClick }: BotsPanelHeaderProps) {
  const activeBotsCount = bots.filter(b => b.active).length;
  const pausedBotsCount = bots.filter(b => !b.active).length;

  return (
    <>
      {/* Header with active bots counter */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <Icon name="Bot" size={14} />
            <span className="font-medium">Боты</span>
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Активно: <span className="font-semibold text-green-600">{activeBotsCount}</span>
          </span>
          {pausedBotsCount > 0 && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className="flex items-center gap-1">
                <Icon name="Pause" size={12} />
                На паузе: <span className="font-semibold">{pausedBotsCount}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-2">
        <Button 
          size="sm" 
          className="h-8 text-xs flex-1"
          onClick={onMACrossoverClick}
        >
          <Icon name="TrendingUp" size={14} className="mr-1" />
          MA Crossover стратегия
        </Button>
          
        <Button 
          size="sm" 
          className="h-8 text-xs" 
          variant="outline"
          onClick={onCreateBotClick}
        >
          <Icon name="Plus" size={14} className="mr-1" />
          Другие
        </Button>
      </div>
    </>
  );
}
