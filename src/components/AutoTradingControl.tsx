import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Bot {
  id: string;
  pair: string;
  market: string;
  strategy: string;
  active: boolean;
  entrySignal?: string;
  status: string;
}

interface AutoTradingControlProps {
  userId: number;
}

export default function AutoTradingControl({ userId }: AutoTradingControlProps) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoTrading, setAutoTrading] = useState(false);
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [checkingKeys, setCheckingKeys] = useState(true);

  useEffect(() => {
    checkApiKeys();
    loadBots();
  }, [userId]);

  const checkApiKeys = async () => {
    try {
      setCheckingKeys(true);
      const response = await fetch('https://function.centerai.tech/api/bots-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({ action: 'check_keys' })
      });
      const data = await response.json();
      setHasApiKeys(data.success && data.hasKeys);
    } catch (error) {
      console.error('Failed to check API keys:', error);
      setHasApiKeys(false);
    } finally {
      setCheckingKeys(false);
    }
  };

  const loadBots = async () => {
    try {
      const response = await fetch('https://function.centerai.tech/api/bots-manager', {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setBots(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load bots:', error);
    }
  };

  const createBot = async (pair: string, strategy: string) => {
    try {
      setLoading(true);
      const botId = `bot-${Date.now()}`;
      
      const response = await fetch('https://function.centerai.tech/api/bots-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          bot_id: botId,
          pair,
          market: 'Bybit',
          strategy,
          active: true,
          entrySignal: null
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Бот создан для пары ${pair}`);
        await loadBots();
      } else {
        toast.error('Ошибка создания бота');
      }
    } catch (error) {
      console.error('Failed to create bot:', error);
      toast.error('Не удалось создать бота');
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = async (botId: string, currentState: boolean) => {
    try {
      const response = await fetch('https://function.centerai.tech/api/bots-manager', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          bot_id: botId,
          active: !currentState
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(!currentState ? 'Бот активирован' : 'Бот остановлен');
        await loadBots();
      }
    } catch (error) {
      console.error('Failed to toggle bot:', error);
      toast.error('Ошибка переключения бота');
    }
  };

  const deleteBot = async (botId: string) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/b6906a5e-7940-4cb3-987e-22ba5092eb13?bot_id=${botId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId.toString() }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Бот удалён');
        await loadBots();
      }
    } catch (error) {
      console.error('Failed to delete bot:', error);
      toast.error('Ошибка удаления бота');
    }
  };

  const runAutoTrader = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://function.centerai.tech/api/auto-trader');
      const data = await response.json();
      
      if (data.success) {
        toast.success('Цикл автотрейдинга завершён');
        await loadBots();
      } else {
        toast.error('Ошибка автотрейдинга');
      }
    } catch (error) {
      console.error('Failed to run auto-trader:', error);
      toast.error('Не удалось запустить автотрейдинг');
    } finally {
      setLoading(false);
    }
  };

  const strategies = [
    'EMA 9/21/55 (тренд + кросс)',
    'RSI 14 + EMA 50',
    'Bollinger Bands + EMA 50',
    'MACD + EMA 200'
  ];

  const quickPairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="Bot" size={20} className="text-primary" />
          <h3 className="font-bold text-lg">Автоматическая торговля</h3>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={loadBots}
            disabled={loading}
          >
            <Icon name="RefreshCw" size={14} className="mr-1" />
            Обновить
          </Button>
          <Button
            size="sm"
            onClick={runAutoTrader}
            disabled={loading}
          >
            <Icon name="Play" size={14} className="mr-1" />
            Запустить сейчас
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {!checkingKeys && !hasApiKeys && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800 mb-1">
                  Настрой API ключи Bybit для автоматической торговли
                </p>
                <p className="text-xs text-yellow-700 mb-2">
                  Без API ключей боты не смогут открывать сделки на бирже
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => {
                    const sidebar = document.querySelector('[data-api-keys-button]') as HTMLElement;
                    if (sidebar) sidebar.click();
                  }}
                >
                  <Icon name="Key" size={12} className="mr-1" />
                  Настроить API ключи
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            <Icon name="Info" size={14} className="inline mr-1" />
            Боты автоматически анализируют рынок и открывают сделки по сигналам стратегий
          </p>
        </div>

        {bots.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-lg">
            <Icon name="Bot" size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">Нет активных ботов</p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {quickPairs.map(pair => (
                <Button
                  key={pair}
                  variant="outline"
                  size="sm"
                  onClick={() => createBot(pair, strategies[0])}
                  disabled={loading}
                >
                  Создать для {pair}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {bots.map(bot => (
              <Card key={bot.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{bot.pair}</p>
                      <Badge variant={bot.active ? 'default' : 'secondary'} className="text-xs">
                        {bot.active ? 'Активен' : 'Остановлен'}
                      </Badge>
                      {bot.entrySignal && (
                        <Badge variant="outline" className="text-xs">
                          <Icon name="TrendingUp" size={10} className="mr-1" />
                          {bot.entrySignal}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{bot.strategy}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={bot.active}
                      onCheckedChange={() => toggleBot(bot.id, bot.active)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteBot(bot.id)}
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="pt-3 border-t">
          <details className="cursor-pointer">
            <summary className="text-sm font-semibold mb-2">Создать нового бота</summary>
            <div className="space-y-3 mt-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Торговая пара</label>
                <div className="grid grid-cols-4 gap-2">
                  {quickPairs.map(pair => (
                    <Button
                      key={pair}
                      variant="outline"
                      size="sm"
                      onClick={() => createBot(pair, strategies[0])}
                      disabled={loading}
                    >
                      {pair.split('/')[0]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </Card>
  );
}