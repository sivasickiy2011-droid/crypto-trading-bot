import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import StrategiesSidebar from '@/components/devconsole/StrategiesSidebar';
import ChatMessages from '@/components/devconsole/ChatMessages';
import ModelSelector from '@/components/devconsole/ModelSelector';
import { useAICommands } from '@/hooks/useAICommands';

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
  const [selectedModel, setSelectedModel] = useState('yandexgpt');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { processAICommands } = useAICommands(userId, setMessages);

  useEffect(() => {
    loadStrategies();
    
    if (autoMonitor) {
      const interval = setInterval(() => {
        analyzeStrategiesAuto();
      }, 60000);
      
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
      const response = await fetch('https://function.centerai.tech/api/strategy-signals?symbols=BTCUSDT,ETHUSDT,SOLUSDT');
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
      const response = await fetch('https://function.centerai.tech/api/yandexgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: prompt,
          model: selectedModel,
          context: {
            strategies: strategies,
            autoMode: autoMonitor
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiResponse = data.response;
        
        await processAICommands(aiResponse);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        }]);
      } else {
        console.error('YandexGPT API Error:', data);
        throw new Error(data.error || 'GPT request failed');
      }
    } catch (error) {
      console.error('DevConsole Error:', error);
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

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleModelChangeMessage = (message: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'system',
      content: message,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="h-[calc(100vh-80px)] p-6 grid grid-cols-[300px_1fr] gap-6">
      <StrategiesSidebar
        strategies={strategies}
        autoMonitor={autoMonitor}
        onAutoMonitorChange={setAutoMonitor}
        onQuickAction={sendToGPT}
        loading={loading}
        onRefresh={loadStrategies}
      />

      <Card className="flex flex-col relative">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Terminal" className="text-primary" size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg">AI Dev Console</h2>
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  onModelChangeMessage={handleModelChangeMessage}
                />
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

        <ChatMessages messages={messages} loading={loading} ref={scrollRef} />

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