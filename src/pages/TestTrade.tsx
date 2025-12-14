import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

export default function TestTrade() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[]>([]);
  const [apiKeyInfo, setApiKeyInfo] = useState<string>('');

  const checkApiKey = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://functions.poehali.dev/6a6a9758-4774-44ac-81a0-af8f328603c2?exchange=bybit-testnet', {
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

  const runTest = async (action: 'open' | 'close' | 'status') => {
    try {
      setLoading(true);
      setResult([`⏳ Запускаю ${action}...`]);

      const response = await fetch('https://functions.poehali.dev/6a007e68-fcdc-44e6-ad68-00a0846ae618', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 2, action })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.steps || ['Успешно']);
        toast.success(`Действие ${action} выполнено`);
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Тестовая торговля SOL/USDT</h1>
          <p className="text-muted-foreground">
            Демо-счет • Testnet Bybit • Без реальных денег
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
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
              <div className="text-sm text-muted-foreground font-mono bg-secondary/50 p-2 rounded">
                {apiKeyInfo}
              </div>
            )}
            
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