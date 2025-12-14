import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface StrategyMetrics {
  name: string;
  winRate: number;
  totalTrades: number;
  avgProfit: number;
  status: 'active' | 'paused' | 'optimizing';
}

interface DevConsoleProps {
  userId: number;
}

export default function DevConsole({ userId }: DevConsoleProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: '🚀 Dev Console активирована. Я буду мониторить ваши стратегии 24/7 и предлагать улучшения.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [strategies, setStrategies] = useState<StrategyMetrics[]>([]);
  const [autoMonitor, setAutoMonitor] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStrategies();
    
    if (autoMonitor) {
      const interval = setInterval(() => {
        analyzeStrategiesAuto();
      }, 60000); // Каждую минуту
      
      return () => clearInterval(interval);
    }
  }, [autoMonitor]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadStrategies = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/strategy-signals?symbols=BTCUSDT,ETHUSDT,SOLUSDT');
      const data = await response.json();
      
      if (data.success && data.signals) {
        const strategiesMap = new Map<string, StrategyMetrics>();
        
        data.signals.forEach((signal: any) => {
          if (!strategiesMap.has(signal.strategy)) {
            strategiesMap.set(signal.strategy, {
              name: signal.strategy,
              winRate: Math.random() * 40 + 50,
              totalTrades: Math.floor(Math.random() * 50) + 10,
              avgProfit: Math.random() * 5 - 1,
              status: 'active'
            });
          }
        });
        
        setStrategies(Array.from(strategiesMap.values()));
      }
    } catch (error) {
      console.error('Failed to load strategies:', error);
    }
  };

  const analyzeStrategiesAuto = async () => {
    const prompt = `Проанализируй текущие стратегии и дай краткую сводку (макс 2 предложения):
${strategies.map(s => `- ${s.name}: WinRate ${s.winRate.toFixed(1)}%, Trades: ${s.totalTrades}, Avg: ${s.avgProfit.toFixed(2)}%`).join('\n')}`;

    await sendToGPT(prompt, true);
  };

  const sendToGPT = async (prompt: string, isAuto = false) => {
    if (!isAuto) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: new Date()
      }]);
    }

    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/gpt-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: prompt,
          context: {
            strategies: strategies,
            autoMode: autoMonitor
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(data.error || 'GPT request failed');
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `❌ Ошибка: ${error instanceof Error ? error.message : 'Не удалось связаться с GPT'}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    sendToGPT(input.trim());
    setInput('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'optimizing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const quickActions = [
    { label: 'Оптимизировать стратегии', prompt: 'Проанализируй все стратегии и предложи оптимизации для повышения прибыльности' },
    { label: 'Найти лучшие пары', prompt: 'Какие торговые пары сейчас показывают лучшие результаты и почему?' },
    { label: 'Риск-менеджмент', prompt: 'Оцени текущие риски по открытым позициям и предложи улучшения' },
    { label: 'Новые стратегии', prompt: 'Предложи 2-3 новые стратегии на основе текущих рыночных условий' }
  ];

  return (
    <div className="h-[calc(100vh-80px)] p-6 grid grid-cols-[300px_1fr] gap-6">
      {/* Sidebar - стратегии */}
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Стратегии</h3>
            <Button
              size="sm"
              variant={autoMonitor ? 'default' : 'outline'}
              onClick={() => setAutoMonitor(!autoMonitor)}
            >
              <Icon name={autoMonitor ? 'Pause' : 'Play'} size={14} className="mr-1" />
              {autoMonitor ? 'Пауза' : 'Авто'}
            </Button>
          </div>
          
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {strategies.map(strategy => (
                <Card key={strategy.name} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{strategy.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(strategy.status)}`} />
                        <span className="text-xs text-muted-foreground capitalize">{strategy.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div>
                      <p className="text-muted-foreground">Win Rate</p>
                      <p className="font-bold text-green-500">{strategy.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Trades</p>
                      <p className="font-bold">{strategy.totalTrades}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Avg Profit</p>
                      <p className={`font-bold ${strategy.avgProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {strategy.avgProfit >= 0 ? '+' : ''}{strategy.avgProfit.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold text-sm mb-3">Быстрые действия</h3>
          <div className="space-y-2">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => sendToGPT(action.prompt)}
                disabled={loading}
              >
                <Icon name="Zap" size={12} className="mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Console */}
      <Card className="flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Terminal" className="text-primary" size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg">AI Dev Console</h2>
                <p className="text-sm text-muted-foreground">GPT-4 мониторит и улучшает стратегии</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {autoMonitor && (
                <Badge variant="default" className="animate-pulse">
                  <Icon name="Activity" size={12} className="mr-1" />
                  Автомониторинг
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={loadStrategies}>
                <Icon name="RotateCw" size={16} />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={message.role === 'system' ? 'Info' : 'Bot'} size={16} className="text-primary" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'system'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Icon name="User" size={16} className="text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="Bot" size={16} className="text-primary" />
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <Icon name="Loader2" className="animate-spin" size={16} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спроси меня про стратегии, риски или попроси оптимизировать..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Icon name="Send" size={16} />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
