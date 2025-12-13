import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

export interface BotLogEntry {
  id: string;
  botId: string;
  botName: string;
  timestamp: string;
  type: 'signal' | 'entry' | 'exit' | 'error' | 'info';
  message: string;
  details?: {
    price?: number;
    pnl?: number;
    signal?: string;
  };
}

interface BotsLogsPanelProps {
  logs: BotLogEntry[];
}

export default function BotsLogsPanel({ logs }: BotsLogsPanelProps) {
  const getLogIcon = (type: BotLogEntry['type']) => {
    switch (type) {
      case 'signal':
        return <Icon name="Radio" size={12} className="text-primary" />;
      case 'entry':
        return <Icon name="ArrowDownToLine" size={12} className="text-success" />;
      case 'exit':
        return <Icon name="ArrowUpFromLine" size={12} className="text-destructive" />;
      case 'error':
        return <Icon name="AlertCircle" size={12} className="text-destructive" />;
      case 'info':
        return <Icon name="Info" size={12} className="text-muted-foreground" />;
    }
  };

  const getLogBadge = (type: BotLogEntry['type']) => {
    switch (type) {
      case 'signal':
        return <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Сигнал</Badge>;
      case 'entry':
        return <Badge variant="default" className="text-[9px] h-4 px-1.5 bg-success">Вход</Badge>;
      case 'exit':
        return <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Выход</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Ошибка</Badge>;
      case 'info':
        return <Badge variant="outline" className="text-[9px] h-4 px-1.5">Инфо</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {logs.length} записей
        </Badge>
      </div>
      
      <ScrollArea className="h-[300px]">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Нет записей в логах</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div 
                  key={log.id}
                  className="p-2 rounded-md border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start space-x-2">
                    <div className="mt-0.5">
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-xs">{log.botName}</span>
                        {getLogBadge(log.type)}
                        <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                          {log.timestamp}
                        </span>
                      </div>
                      <p className="text-[10px] text-foreground">
                        {log.message}
                      </p>
                      
                      {log.details && (
                        <div className="mt-1.5 flex items-center space-x-3 text-[10px]">
                          {log.details.price && (
                            <div className="flex items-center space-x-1">
                              <span className="text-muted-foreground">Цена:</span>
                              <span className="font-mono text-foreground">${log.details.price.toFixed(2)}</span>
                            </div>
                          )}
                          {log.details.pnl !== undefined && (
                            <div className="flex items-center space-x-1">
                              <span className="text-muted-foreground">PnL:</span>
                              <span className={`font-mono font-semibold ${log.details.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {log.details.pnl >= 0 ? '+' : ''}{log.details.pnl.toFixed(2)}%
                              </span>
                            </div>
                          )}
                          {log.details.signal && (
                            <div className="flex items-center space-x-1">
                              <span className="text-muted-foreground">Сигнал:</span>
                              <span className="text-foreground">{log.details.signal}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
    </div>
  );
}