import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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

export default function ApiKeysModal({ open, onOpenChange, userId }: ApiKeysModalProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [hasKeys, setHasKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    if (open && userId) {
      setIsLoading(true);
      getApiKeys(userId, 'bybit')
        .then((result) => {
          if (result.success && result.hasKeys) {
            setApiKey(result.api_key || '');
            setApiSecret(result.api_secret || '***hidden***');
            setHasKeys(true);
          } else {
            setApiKey('');
            setApiSecret('');
            setHasKeys(false);
          }
        })
        .catch(() => {
          setHasKeys(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, userId]);

  const handleSave = async () => {
    if (!apiKey || !apiSecret) {
      toast({
        title: 'Ошибка',
        description: 'Заполни оба поля',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await saveApiKeys(userId, apiKey, apiSecret);
      
      if (result.success) {
        setHasKeys(true);
        toast({
          title: 'Успешно',
          description: 'API ключи сохранены',
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



  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteApiKeys(userId);
      
      if (result.success) {
        setApiKey('');
        setApiSecret('');
        setHasKeys(false);
        toast({
          title: 'Успешно',
          description: 'API ключи удалены',
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

  const renderKeyInputs = (
    keyValue: string,
    secretValue: string,
    showSecret: boolean,
    onKeyChange: (value: string) => void,
    onSecretChange: (value: string) => void,
    onToggleShow: () => void,
    onSave: () => void,
    onDelete: () => void,
    hasKeysValue: boolean,
    isTestnet: boolean = false
  ) => (
    <>
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={20} className="text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Как получить API ключи{isTestnet ? ' для Testnet' : ''}:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Войди на {isTestnet ? 'testnet.bybit.com' : 'Bybit.com'} → Профиль → API</li>
              <li>Создай новый API ключ</li>
              <li>Разрешения: "Чтение" и "Торговля"</li>
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
              type={showSecret ? "text" : "password"}
              placeholder="Вставь API ключ"
              value={keyValue}
              onChange={(e) => onKeyChange(e.target.value)}
              disabled={isLoading}
              className="font-mono pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={onToggleShow}
            >
              <Icon name={showSecret ? "EyeOff" : "Eye"} size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Secret Key</Label>
          <div className="relative">
            <Input
              type={showSecret ? "text" : "password"}
              placeholder="Вставь Secret ключ"
              value={secretValue}
              onChange={(e) => onSecretChange(e.target.value)}
              disabled={isLoading}
              className="font-mono pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={onToggleShow}
            >
              <Icon name={showSecret ? "EyeOff" : "Eye"} size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button onClick={onSave} disabled={isLoading} className="flex-1">
          <Icon name="Save" size={16} className="mr-2" />
          {hasKeysValue ? 'Обновить' : 'Сохранить'}
        </Button>
        {hasKeysValue && (
          <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
            <Icon name="Trash2" size={16} className="mr-2" />
            Удалить
          </Button>
        )}
      </div>
    </>
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

        <div className="space-y-6 mt-4">
          {renderKeyInputs(
            apiKey, 
            apiSecret, 
            showSecrets,
            setApiKey,
            setApiSecret,
            () => setShowSecrets(!showSecrets),
            handleSave,
            () => handleDelete('bybit'),
            hasKeys,
            false
          )}
        </div>

        <div className="space-y-6 mt-4 hidden">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start space-x-3">
              <Icon name="Info" size={20} className="text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Как получить API ключи:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Войди на Bybit → Профиль → API</li>
                  <li>Создай новый API ключ</li>
                  <li>Разрешения: "Чтение" и "Торговля"</li>
                  <li>Скопируй API Key и Secret Key</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showSecrets ? "text" : "password"}
                  placeholder="Вставь API ключ"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
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
              <Label htmlFor="apiSecret">Secret Key</Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  type={showSecrets ? "text" : "password"}
                  placeholder="Вставь Secret ключ"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
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

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {hasKeys && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Удалить ключи
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Закрыть
              </Button>
              <Button onClick={handleSave} disabled={isLoading || !apiKey || !apiSecret}>
                {isLoading ? (
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                ) : (
                  <Icon name="Save" size={16} className="mr-2" />
                )}
                {isLoading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}