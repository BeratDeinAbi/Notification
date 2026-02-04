import React from 'react';
import { LayoutDashboard, Bell, Settings, PieChart, FlaskConical, BookOpen, Heart, Map, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

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
    <div className="h-screen py-6 pl-6 flex flex-col z-50 pointer-events-none sticky top-0">
      <aside
        className={`h-full flex flex-col relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-auto shadow-2xl
          ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}
          ${theme === 'dark' ? 'bg-[#0a0e17] border-white/5' : 'bg-[#f8fafc] border-black/5'}
        `}
        style={{
          borderRadius: '40px',
          borderWidth: '1px',
        }}
      >
        {/* Header with Logo */}
        <div className="p-4 flex flex-col items-center">
          <div className="w-full flex items-center mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-black" />
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex flex-col">
                <span className={`font-bold text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>TradePro</span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest leading-none">Global</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-2xl transition-all duration-200 group relative
                  ${isCollapsed ? 'justify-center h-12' : 'px-3 py-3 h-12'}
                  ${isActive
                    ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/5 text-black')
                    : 'text-zinc-500 hover:text-cyan-500 hover:bg-black/5 dark:hover:bg-white/5'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Active indicator bar on the left */}
                {isActive && (
                  <div className={`absolute left-[-12px] top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full ${theme === 'dark' ? 'bg-cyan-400' : 'bg-cyan-600'}`} />
                )}

                {/* Icon */}
                <div className={`flex items-center justify-center transition-transform duration-200
                  ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                `}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                {/* Label */}
                <div
                  className={`ml-3 overflow-hidden transition-all duration-300
                    ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                  `}
                >
                  <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                </div>

                {/* Badge */}
                {item.badge && !isCollapsed && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                    {item.badge}
                  </span>
                )}

                {/* Collapsed badge dot */}
                {item.badge && isCollapsed && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full shadow-lg shadow-rose-500/30" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 space-y-2 mb-2">
          {/* Donation Button */}
          <button
            onClick={onOpenDonation}
            className={`w-full flex items-center rounded-2xl transition-all duration-200 group
              ${isCollapsed ? 'justify-center h-12' : 'px-3 py-3 h-12'}
              bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/20 text-white
            `}
            title={isCollapsed ? 'Unterstützen' : undefined}
          >
            <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shadow-sm text-white backdrop-blur-sm">
              <Heart size={14} fill="currentColor" />
            </div>

            {!isCollapsed && (
              <div className="ml-3 flex flex-col text-left">
                <span className="text-white font-medium text-sm">Join us</span>
              </div>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className={`w-full flex items-center rounded-2xl transition-all duration-200 text-zinc-500 hover:text-cyan-500 hover:bg-black/5 dark:hover:bg-white/5
              ${isCollapsed ? 'justify-center h-12' : 'px-3 py-3 h-12'}
            `}
            title="Einstellungen"
          >
            <Settings size={20} />
            {!isCollapsed && (
              <span className="ml-3 font-medium text-sm">Settings</span>
            )}
          </button>
        </div>

        {/* Toggle Expand/Collapse - Separated floating circle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-8 flex items-center justify-center w-6 h-6 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer z-[60] border
            ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}
          `}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </div>
  );
};

export default Sidebar;
