import React from 'react';
import { LayoutDashboard, Bell, PieChart, FlaskConical, BookOpen, Heart, Map, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: 'DASHBOARD' | 'RULES' | 'PORTFOLIO' | 'STRATEGIES' | 'BACKTEST' | 'RSI_MAP';
  setActiveTab: (tab: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  onOpenSettings: () => void;
  onOpenDonation: () => void;
  signalCount: number;
  theme: 'dark' | 'light';
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  onOpenSettings,
  onOpenDonation,
  signalCount,
  theme,
}) => {

  const navItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Marktübersicht' },
    { id: 'RSI_MAP', icon: Map, label: 'RSI-Karte' },
    { id: 'RULES', icon: Bell, label: 'Alarme', badge: signalCount > 0 ? signalCount : null },
    { id: 'PORTFOLIO', icon: PieChart, label: 'Depot Tracker' },
    { id: 'STRATEGIES', icon: BookOpen, label: 'Strategien' },
    { id: 'BACKTEST', icon: FlaskConical, label: 'Backtesting' }
  ];

  return (
    <div className="h-screen py-5 pl-5 flex flex-col z-50 pointer-events-none sticky top-0">
      <aside
        className="h-full flex flex-col relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-auto w-[68px] bg-white/80 backdrop-blur-sm"
        style={{
          borderRadius: '28px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div className="p-3 flex flex-col items-center pt-5">
          <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">T</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-1.5 flex flex-col items-center">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 relative
                  ${isActive
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
                  }
                `}
                title={item.label}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />

                {/* Badge dot */}
                {item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-sm" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-2.5 space-y-1.5 mb-3 flex flex-col items-center">
          {/* Donation Button */}
          <button
            onClick={onOpenDonation}
            className="w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 text-gray-400 hover:text-rose-500 hover:bg-rose-50"
            title="Unterstützen"
          >
            <Heart size={20} strokeWidth={1.8} />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 text-gray-400 hover:text-gray-700 hover:bg-black/5"
            title="Einstellungen"
          >
            <Settings size={20} strokeWidth={1.8} />
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
