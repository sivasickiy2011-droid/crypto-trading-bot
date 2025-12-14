import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { saveApiKeys, getApiKeys, deleteApiKeys } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ApiKeysModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
}

interface KeysState {
  apiKey: string;
  apiSecret: string;
  hasKeys: boolean;
}

export default function ApiKeysModal({ open, onOpenChange, userId }: ApiKeysModalProps) {
  const { toast } = useToast();
  const [liveKeys, setLiveKeys] = useState<KeysState>({ apiKey: '', apiSecret: '', hasKeys: false });
  const [testKeys, setTestKeys] = useState<KeysState>({ apiKey: '', apiSecret: '', hasKeys: false });
  const [isLoading, setIsLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const loadKeys = async (exchange: 'bybit' | 'bybit-testnet') => {
    try {
      const result = await getApiKeys(userId, exchange);
      const keys: KeysState = {
        apiKey: result.success ? result.api_key || '' : '',
        apiSecret: result.success ? result.api_secret || '' : '',
        hasKeys: result.success
      };
      
      if (exchange === 'bybit') {
        setLiveKeys(keys);
      } else {
        setTestKeys(keys);
      }
    } catch (error) {
      console.error(`Failed to load ${exchange} keys`, error);
    }
  };

  useEffect(() => {
    if (open && userId) {
      setIsLoading(true);
      Promise.all([
        loadKeys('bybit'),
        loadKeys('bybit-testnet')
      ]).finally(() => setIsLoading(false));
    }
  }, [open, userId]);

  const handleSave = async (exchange: 'bybit' | 'bybit-testnet') => {
    const keys = exchange === 'bybit' ? liveKeys : testKeys;
    
    if (!keys.apiKey || !keys.apiSecret) {
      toast({
        title: 'Ошибка',
        description: 'Заполни оба поля',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await saveApiKeys(userId, keys.apiKey, keys.apiSecret, exchange);
      
      if (result.success) {
        if (exchange === 'bybit') {
          setLiveKeys({ ...keys, hasKeys: true });
        } else {
          setTestKeys({ ...keys, hasKeys: true });
        }
        toast({
          title: 'Успешно',
          description: `API ключи ${exchange === 'bybit' ? 'боевого' : 'тестового'} аккаунта сохранены`
        });
      } else {
        toast({
          title: 'Ошибка',
          description: result.error || 'Не удалось сохранить ключи',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить ключи',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (exchange: 'bybit' | 'bybit-testnet') => {
    setIsLoading(true);
    try {
      const result = await deleteApiKeys(userId, exchange);
      
      if (result.success) {
        if (exchange === 'bybit') {
          setLiveKeys({ apiKey: '', apiSecret: '', hasKeys: false });
        } else {
          setTestKeys({ apiKey: '', apiSecret: '', hasKeys: false });
        }
        toast({
          title: 'Успешно',
          description: `API ключи ${exchange === 'bybit' ? 'боевого' : 'тестового'} аккаунта удалены`
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось удалить ключи',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить ключи',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderKeysTab = (
    exchange: 'bybit' | 'bybit-testnet',
    keys: KeysState,
    setKeys: (keys: KeysState) => void,
    isTestnet: boolean
  ) => (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={20} className="text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Как получить API ключи{isTestnet ? ' для демо-счета' : ''}:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Войди на Bybit.com{isTestnet ? ' → Переключись в "Demo Trading" (правый верхний угол)' : ''}</li>
              <li>Наведи на аватар → нажми "API"</li>
              <li>Создай новый API ключ с правами "Чтение" и "Торговля"</li>
              <li>Скопируй API Key и Secret Key</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>API Key</Label>
          <div className="relative">
            <Input
              type={showSecrets ? "text" : "password"}
              placeholder="Вставь API ключ"
              value={keys.apiKey}
              onChange={(e) => setKeys({ ...keys, apiKey: e.target.value })}
              disabled={isLoading}
              className="font-mono pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              <Icon name={showSecrets ? "EyeOff" : "Eye"} size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Secret Key</Label>
          <div className="relative">
            <Input
              type={showSecrets ? "text" : "password"}
              placeholder="Вставь Secret ключ"
              value={keys.apiSecret}
              onChange={(e) => setKeys({ ...keys, apiSecret: e.target.value })}
              disabled={isLoading}
              className="font-mono pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              <Icon name={showSecrets ? "EyeOff" : "Eye"} size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button onClick={() => handleSave(exchange)} disabled={isLoading} className="flex-1">
          <Icon name="Save" size={16} className="mr-2" />
          {keys.hasKeys ? 'Обновить' : 'Сохранить'}
        </Button>
        {keys.hasKeys && (
          <Button variant="destructive" onClick={() => handleDelete(exchange)} disabled={isLoading}>
            <Icon name="Trash2" size={16} className="mr-2" />
            Удалить
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">API ключи Bybit</DialogTitle>
          <DialogDescription>
            Подключи Bybit для торговли в боевом или тестовом режиме
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="live" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live">
              <Icon name="Zap" size={16} className="mr-2" />
              Реальный счет
            </TabsTrigger>
            <TabsTrigger value="testnet">
              <Icon name="TestTube" size={16} className="mr-2" />
              Демо-счет
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-6">
            {renderKeysTab('bybit', liveKeys, setLiveKeys, false)}
          </TabsContent>

          <TabsContent value="testnet" className="mt-6">
            {renderKeysTab('bybit-testnet', testKeys, setTestKeys, true)}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}