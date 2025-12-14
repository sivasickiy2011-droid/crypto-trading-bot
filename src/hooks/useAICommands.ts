interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function useAICommands(userId: number, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
  const processAICommands = async (aiResponse: string) => {
    const managerUrl = 'https://functions.poehali.dev/cd9a0b3b-e47d-4b62-8334-5c9308d3fdc1';
    
    // GET_CONFIG
    if (aiResponse.includes('GET_CONFIG')) {
      try {
        const response = await fetch(managerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', userId })
        });
        const data = await response.json();
        if (data.success) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: `📋 Текущие настройки:\n${data.summary}`,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Failed to get config:', error);
      }
    }
    
    // UPDATE_MA
    const maMatch = aiResponse.match(/UPDATE_MA\s+short=(\d+)\s+long=(\d+)\s+sl=([\d.]+)\s+tp=([\d.]+)/);
    if (maMatch) {
      try {
        const config = {
          enabled: true,
          shortPeriod: parseInt(maMatch[1]),
          longPeriod: parseInt(maMatch[2]),
          stopLoss: parseFloat(maMatch[3]),
          takeProfit: parseFloat(maMatch[4])
        };
        
        const response = await fetch(managerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_config',
            userId,
            strategyName: 'ma-crossover',
            config
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: `✅ ${data.message}`,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Failed to update MA:', error);
      }
    }
    
    // RUN_BACKTEST
    const backtestMatch = aiResponse.match(/RUN_BACKTEST\s+symbol=(\w+)\s+strategy=([\w-]+)\s+period=(\w+)/);
    if (backtestMatch) {
      try {
        const response = await fetch(managerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'run_backtest',
            userId,
            params: {
              symbol: backtestMatch[1],
              strategy: backtestMatch[2],
              period: backtestMatch[3]
            }
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: `📊 Результат бэктеста:\n${data.summary}`,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Failed to run backtest:', error);
      }
    }
  };

  return { processAICommands };
}
