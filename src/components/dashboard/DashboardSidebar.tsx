import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onConfigOpen: () => void;
  onApiKeysOpen: () => void;
  onLogout: () => void;
}

export default function DashboardSidebar({
  activeTab,
  onTabChange,
  onConfigOpen,
  onApiKeysOpen,
  onLogout
}: DashboardSidebarProps) {
  return (
    <aside className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 space-y-6">
      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
        <Icon name="TrendingUp" size={24} className="text-primary-foreground" />
      </div>
      <Separator className="w-8" />
      <Button 
        variant="ghost" 
        size="icon" 
        className={`text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent ${activeTab === 'dashboard' ? 'bg-sidebar-accent text-primary' : ''}`}
        onClick={() => onTabChange('dashboard')}
      >
        <Icon name="LayoutDashboard" size={20} />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className={`text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent ${activeTab === 'backtest' ? 'bg-sidebar-accent text-primary' : ''}`}
        onClick={() => onTabChange('backtest')}
      >
        <Icon name="LineChart" size={20} />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent"
        onClick={onConfigOpen}
        title="Настройки стратегий"
      >
        <Icon name="Settings" size={20} />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent"
        onClick={onApiKeysOpen}
        title="API ключи Bybit"
      >
        <Icon name="Key" size={20} />
      </Button>
      <div className="flex-1" />
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent"
        onClick={onLogout}
        title="Выйти"
      >
        <Icon name="LogOut" size={20} />
      </Button>
    </aside>
  );
}
