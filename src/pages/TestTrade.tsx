import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface BalanceData {
  balance: number;
  initial_balance: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  winrate: number;
  roi: number;
}

export default function TestTrade() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[]>([]);
  const [apiKeyInfo, setApiKeyInfo] = useState<string>('');
  const [balance, setBalance] = useState<BalanceData | null>(null);

  const loadBalance = async () => {
    try {
      const response = await fetch('https://function.centerai.tech/api/virtual-balance', {
        headers: { 'X-User-Id': '2' }
      });
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.data);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const checkApiKey = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://function.centerai.tech/api/api-keys?exchange=bybit-testnet', {
        headers: { 'X-User-Id': '2' }
      });
      const data = await response.json();
      
      if (data.success) {
        const key = data.api_key || '';
        setApiKeyInfo(`Ключ: ${key.substring(0, 5)}...${key.substring(key.length - 3)} (${key.length} символов)`);
      } else {
        setApiKeyInfo('Ключ не найден');
      }
    } catch (error) {
      setApiKeyInfo('Ошибка проверки');
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (action: 'open' | 'close' | 'status' | 'diagnose') => {
    try {
      setLoading(true);
      setResult([`⏳ Запускаю ${action}...`]);

      const response = await fetch('https://function.centerai.tech/api/test-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 2, action })
      });

      const data = await response.json();

      if (data.success) {
        const steps = data.steps || ['Успешно'];
        if (data.api_url) {
          steps.push(`🌐 API URL: ${data.api_url}`);
        }
        setResult(steps);
        toast.success(`Действие ${action} выполнено`);
        
        // Reload balance after trade action
        if (action === 'open' || action === 'close') {
          await loadBalance();
        }
      } else {
        setResult([`❌ Ошибка: ${data.error}`, JSON.stringify(data.details || {}, null, 2)]);
        toast.error(`Ошибка: ${data.error}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setResult([`❌ ${message}`]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Load balance on mount
  useEffect(() => {
    loadBalance();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎮 Виртуальный симулятор торговли</h1>
          <p className="text-muted-foreground">
            Реальные цены • Виртуальные сделки • Без риска
          </p>
          <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-start space-x-3">
              <Icon name="Gamepad2" size={20} className="text-green-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1 text-green-600 dark:text-green-500">Виртуальный симулятор (не реальные деньги)</p>
                <p className="text-muted-foreground">
                  Цены берутся с реального рынка Bybit, но сделки виртуальные. 
                  Отличный способ протестировать стратегии без финансового риска.
                  Позиции и PnL сохраняются в базе данных.
                </p>
              </div>
            </div>
          </div>
        </div>

        {balance && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-green-500/5 to-blue-500/5">
            <h2 className="text-lg font-bold mb-4">💰 Виртуальный баланс</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Баланс</p>
                <p className="text-2xl font-bold">${balance.balance.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PnL</p>
                <p className={`text-2xl font-bold ${balance.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {balance.total_pnl >= 0 ? '+' : ''}{balance.total_pnl.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className={`text-2xl font-bold ${balance.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {balance.roi >= 0 ? '+' : ''}{balance.roi.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Винрейт</p>
                <p className="text-2xl font-bold">{balance.winrate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">
                  {balance.winning_trades}W / {balance.losing_trades}L
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <Button
              onClick={() => runTest('diagnose')}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Icon name="Stethoscope" className="mr-2" size={20} />
              🔧 Диагностика API (права + URL)
            </Button>

            <div className="border-t pt-4">
              <Button
                onClick={checkApiKey}
                disabled={loading}
                className="w-full"
                variant="secondary"
                size="sm"
              >
                <Icon name="Key" className="mr-2" size={16} />
                Проверить API ключ
              </Button>
              {apiKeyInfo && (
                <div className="text-sm text-muted-foreground font-mono bg-secondary/50 p-2 rounded mt-2">
                  {apiKeyInfo}
                </div>
              )}
            </div>
            
            <Button
              onClick={() => runTest('status')}
              disabled={loading}
              className="w-full"
              variant="outline"
              size="lg"
            >
              <Icon name="Info" className="mr-2" size={20} />
              Проверить статус позиции
            </Button>

            <Button
              onClick={() => runTest('open')}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Icon name="TrendingUp" className="mr-2" size={20} />
              Открыть тестовую позицию (LONG)
            </Button>

            <Button
              onClick={() => runTest('close')}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
            >
              <Icon name="X" className="mr-2" size={20} />
              Закрыть позицию
            </Button>
          </div>
        </Card>

        {result.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Результат:</h3>
            <div className="space-y-2 font-mono text-sm">
              {result.map((line, i) => (
                <div key={i} className="p-2 bg-muted rounded">
                  {line}
                </div>
              ))}
            </div>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center p-8">
            <Icon name="Loader2" className="animate-spin" size={32} />
          </div>
        )}
      </div>
    </div>
  );
}