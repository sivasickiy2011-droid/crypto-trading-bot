import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface AIModel {
  id: string;
  name: string;
  description: string;
  speed: string;
  quality: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onModelChangeMessage: (message: string) => void;
}

const availableModels: AIModel[] = [
  {
    id: 'yandexgpt',
    name: 'YandexGPT',
    description: 'Основная модель для сложных задач',
    speed: 'Быстрая',
    quality: 'Отличная'
  },
  {
    id: 'yandexgpt-lite',
    name: 'YandexGPT Lite',
    description: 'Облегчённая версия для простых задач',
    speed: 'Очень быстрая',
    quality: 'Хорошая'
  }
];

export default function ModelSelector({
  selectedModel,
  onModelChange,
  onModelChangeMessage
}: ModelSelectorProps) {
  const [showModels, setShowModels] = useState(false);
  
  const currentModel = availableModels.find(m => m.id === selectedModel);

  const handleModelSelect = (modelId: string, modelName: string) => {
    onModelChange(modelId);
    setShowModels(false);
    onModelChangeMessage(`🔄 Модель изменена на ${modelName}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowModels(!showModels)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        {currentModel?.name || 'YandexGPT'} • Yandex Cloud
        <Icon name={showModels ? 'ChevronUp' : 'ChevronDown'} size={14} />
      </button>
      
      {showModels && (
        <div className="absolute top-full left-0 mt-2 bg-card border rounded-lg shadow-lg p-3 z-50 w-[500px]">
          <p className="text-xs text-muted-foreground mb-3">Выберите AI модель для консоли:</p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {availableModels.map(model => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.id, model.name)}
                className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary ${
                  selectedModel === model.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{model.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                    <div className="flex gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <Icon name="Zap" size={10} className="mr-1" />
                        {model.speed}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Icon name="Award" size={10} className="mr-1" />
                        {model.quality}
                      </Badge>
                    </div>
                  </div>
                  {selectedModel === model.id && (
                    <Icon name="Check" size={16} className="text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
