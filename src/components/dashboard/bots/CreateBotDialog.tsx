import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Bot } from './useBotsManager';

interface CreateBotDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateBot: (botData: Bot) => void;
}

export default function CreateBotDialog({ open, onClose, onCreateBot }: CreateBotDialogProps) {
  const [newBot, setNewBot] = useState({
    pair: 'BTC/USDT',
    market: 'futures' as 'spot' | 'futures',
    strategy: 'ma-crossover'
  });

  const handleCreate = () => {
    const strategies: { [key: string]: string } = {
      'ma-crossover': 'EMA 9/21/55 (тренд + кросс)',
      'rsi': 'RSI 14 + EMA50 (отбой от зон)',
      'bollinger': 'BB + EMA50 (отбой от границ)',
      'macd': 'MACD + EMA200 (дивергенция)'
    };

    const newBotData: Bot = {
      id: Date.now().toString(),
      pair: newBot.pair,
      market: newBot.market,
      strategy: strategies[newBot.strategy],
      status: 'searching',
      active: true
    };

    onCreateBot(newBotData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Создать нового бота</DialogTitle>
          <DialogDescription>
            Бот автоматически торгует по выбранной стратегии (LONG и SHORT позиции)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Торговая пара</Label>
            <Select value={newBot.pair} onValueChange={(v) => setNewBot(prev => ({ ...prev, pair: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                <SelectItem value="BNB/USDT">BNB/USDT</SelectItem>
                <SelectItem value="XRP/USDT">XRP/USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Тип рынка</Label>
            <Select value={newBot.market} onValueChange={(v: 'spot' | 'futures') => setNewBot(prev => ({ ...prev, market: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spot">Спот</SelectItem>
                <SelectItem value="futures">Фьючерсы</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Стратегия</Label>
            <Select value={newBot.strategy} onValueChange={(v) => setNewBot(prev => ({ ...prev, strategy: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ma-crossover">EMA 9/21/55 (тренд + кросс)</SelectItem>
                <SelectItem value="rsi">RSI 14 + EMA50 (отбой от зон)</SelectItem>
                <SelectItem value="bollinger">BB + EMA50 (отбой от границ)</SelectItem>
                <SelectItem value="macd">MACD + EMA200 (дивергенция)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
          <Button className="flex-1" onClick={handleCreate}>
            <Icon name="Plus" size={16} className="mr-2" />
            Создать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
