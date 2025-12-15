import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface ApiKeysSettingsProps {
  userId: number;
}

export default function ApiKeysSettings({ userId }: ApiKeysSettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [hasKeys, setHasKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkApiKeys();
  }, [userId]);

  const checkApiKeys = async () => {
    try {
      const response = await fetch('https://function.centerai.tech/api/bots-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({ action: 'check_keys' })
      });

      const data = await response.json();
      setHasKeys(data.hasKeys || false);
    } catch (error) {
      console.error('Error checking API keys:', error);
    }
  };

  const saveApiKeys = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setMessage('⚠️ Заполните оба поля');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('https://function.centerai.tech/api/bots-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          action: 'save_keys',
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ API ключи сохранены');
        setHasKeys(true);
        setApiKey('');
        setApiSecret('');
      } else {
        setMessage(`❌ Ошибка: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Ошибка сохранения: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApiKeys = async () => {
    if (!confirm('Удалить API ключи? Боты перестанут работать.')) return;

    setIsLoading(true);
    try {
      const response = await fetch('https://function.centerai.tech/api/bots-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({ action: 'delete_keys' })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('✅ API ключи удалены');
        setHasKeys(false);
      }
    } catch (error) {
      setMessage(`❌ Ошибка удаления: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Key" size={20} />
          API ключи Bybit
        </CardTitle>
        <CardDescription>
          {hasKeys 
            ? '✅ API ключи настроены. Боты могут торговать.' 
            : '⚠️ Настройте API ключи для автоматической торговли'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasKeys && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon name="Info" size={16} />
              Как получить API ключи Bybit:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Войдите на <a href="https://www.bybit.com" target="_blank" className="text-blue-600 underline">bybit.com</a></li>
              <li>Перейдите в API Management</li>
              <li>Создайте новый API ключ с правами: Read, Trade, Position</li>
              <li>Скопируйте API Key и Secret Key сюда</li>
            </ol>
          </div>
        )}

        {!hasKeys && (
          <>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="text"
                placeholder="Введите API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">Secret Key</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Введите Secret Key"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
              />
            </div>

            <Button 
              onClick={saveApiKeys} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить ключи'}
            </Button>
          </>
        )}

        {hasKeys && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                ✅ API ключи настроены. Боты работают автоматически каждые 15 минут.
              </p>
            </div>
            <Button 
              onClick={deleteApiKeys}
              disabled={isLoading}
              variant="destructive"
            >
              <Icon name="Trash2" size={16} />
              Удалить API ключи
            </Button>
          </div>
        )}

        {message && (
          <p className={`text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}