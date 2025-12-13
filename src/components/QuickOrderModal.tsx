import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface QuickOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  price: number;
  symbol: string;
  orderType: 'buy' | 'sell';
}

export default function QuickOrderModal({ 
  open, 
  onOpenChange, 
  price, 
  symbol,
  orderType 
}: QuickOrderModalProps) {
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState('1');

  const handleSubmit = () => {
    console.log('Placing order:', { price, amount, leverage, orderType, symbol });
    onOpenChange(false);
    setAmount('');
    setLeverage('1');
  };

  const total = parseFloat(amount) * price || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon name={orderType === 'buy' ? 'TrendingUp' : 'TrendingDown'} 
                  size={20} 
                  className={orderType === 'buy' ? 'text-success' : 'text-destructive'} 
            />
            <span>Быстрый ордер: {orderType === 'buy' ? 'Покупка' : 'Продажа'}</span>
          </DialogTitle>
          <DialogDescription>
            {symbol.replace('USDT', '/USDT')} по цене из стакана
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Цена</Label>
            <div className="flex items-center space-x-2">
              <Input 
                type="number" 
                value={price.toFixed(2)} 
                disabled
                className="font-mono"
              />
              <Badge variant="outline" className="whitespace-nowrap">
                USDT
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Количество</Label>
            <div className="flex items-center space-x-2">
              <Input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono"
              />
              <Badge variant="outline" className="whitespace-nowrap">
                {symbol.replace('USDT', '')}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Плечо</Label>
            <div className="flex items-center space-x-2">
              <Input 
                type="number" 
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                min="1"
                max="100"
                className="font-mono"
              />
              <Badge variant="outline">x</Badge>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 5, 10, 20, 50].map(lev => (
                <Button 
                  key={lev}
                  variant={leverage === lev.toString() ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={() => setLeverage(lev.toString())}
                >
                  {lev}x
                </Button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-secondary space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Сумма:</span>
              <span className="font-mono font-semibold">{total.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">С плечом:</span>
              <span className="font-mono font-semibold">{(total * parseFloat(leverage)).toFixed(2)} USDT</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button 
            variant={orderType === 'buy' ? 'default' : 'destructive'}
            className="flex-1"
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            <Icon name={orderType === 'buy' ? 'Plus' : 'Minus'} size={16} className="mr-2" />
            {orderType === 'buy' ? 'Купить' : 'Продать'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
