import React from 'react';
import { LayoutDashboard, Bell, PieChart, BookOpen, Map, Settings } from 'lucide-react';

interface MobileNavbarProps {
    activeTab: 'DASHBOARD' | 'RULES' | 'PORTFOLIO' | 'STRATEGIES' | 'BACKTEST' | 'RSI_MAP';
    setActiveTab: (tab: any) => void;
    onOpenSettings: () => void;
    signalCount: number;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ activeTab, setActiveTab, onOpenSettings, signalCount }) => {
    const tabs = [
        { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Home' },
        { id: 'RSI_MAP', icon: Map, label: 'Map' },
        { id: 'RULES', icon: Bell, label: 'Alerts', badge: signalCount },
        { id: 'PORTFOLIO', icon: PieChart, label: 'Port' },
        { id: 'STRATEGIES', icon: BookOpen, label: 'Strat' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17]/80 backdrop-blur-xl border-t border-white/5 pb-safe-area-bottom">
            <div className="flex justify-around items-center h-[60px] px-2">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
                        >
                            {isActive && (
                                <div className="absolute top-0 w-8 h-0.5 bg-white/80 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                            )}

                            <div className={`relative transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
                                <tab.icon size={20} strokeWidth={1.5} />
                                {(tab.badge || 0) > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                    </span>
                                )}
                            </div>

                            <span className={`text-[9px] font-medium tracking-wide ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}

                {/* Settings Tab as secondary action */}
                <button
                    onClick={onOpenSettings}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-300"
                >
                    <Settings size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-medium tracking-wide text-slate-600">Sets</span>
                </button>
            </div>
        </div>
    );
};

export default MobileNavbar;
