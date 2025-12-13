import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { setPassword } from '@/lib/api';

interface SetPasswordProps {
  userId: number;
  username: string;
  onPasswordSet: (token: string) => void;
}

export default function SetPassword({ userId, username, onPasswordSet }: SetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      const result = await setPassword(userId, newPassword);
      
      if (result.success && result.token) {
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('user_id', userId.toString());
        localStorage.setItem('username', username);
        onPasswordSet(result.token);
      } else {
        setError(result.error || 'Ошибка установки пароля');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="space-y-3 text-center">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <Icon name="Lock" size={32} className="text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Установка пароля</CardTitle>
          <CardDescription>
            Привет, <strong>{username}</strong>! <br/>
            Установи свой пароль для входа в систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Минимум 6 символов"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтверди пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Повтори пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Icon name="AlertCircle" size={16} className="text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Check" size={16} className="mr-2" />
                  Установить пароль
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
