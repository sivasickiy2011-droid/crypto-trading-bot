import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: string;
  badge?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  draggable?: boolean;
}

export default function CollapsiblePanel({ 
  title, 
  children, 
  defaultOpen = true, 
  icon,
  badge,
  onDragStart,
  onDragOver,
  onDrop,
  draggable = false
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card 
      className="bg-black/90 border-zinc-800 transition-all"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CardHeader 
        className="pb-2 cursor-pointer select-none hover:bg-zinc-900/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {draggable && (
              <Icon name="GripVertical" size={16} className="text-zinc-600 cursor-grab active:cursor-grabbing" />
            )}
            {icon && <Icon name={icon} size={16} className="text-zinc-400" />}
            <CardTitle className="text-sm text-white">{title}</CardTitle>
            {badge && (
              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                {badge}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <Icon 
              name={isOpen ? "ChevronUp" : "ChevronDown"} 
              size={16} 
              className="text-zinc-400"
            />
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0 pb-3">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
