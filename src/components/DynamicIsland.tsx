import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

interface DynamicIslandProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
}

const DynamicIsland: React.FC<DynamicIslandProps> = ({ toasts, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const activeToast = toasts[0];

  useEffect(() => {
    if (activeToast) {
      setExpanded(true);
      const timer = setTimeout(() => {
        setExpanded(false);
        setTimeout(() => onRemove(activeToast.id), 300);
      }, activeToast.duration || 5000);
      return () => clearTimeout(timer);
    } else {
      setExpanded(false);
    }
  }, [activeToast, onRemove]);

  if (!activeToast && !expanded) return null;

  const getIcon = () => {
    switch (activeToast?.type) {
      case 'success': return <CheckCircle size={20} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
      case 'error': return <AlertTriangle size={20} className="text-rose-500" />;
      default: return <Bell size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex justify-center pointer-events-none">
      <div
        className={`
          bg-white border border-gray-200 shadow-xl rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden pointer-events-auto
          ${expanded ? 'w-[400px] h-[80px] px-4' : 'w-[120px] h-[36px] px-1'}
        `}
        onMouseEnter={() => activeToast && setExpanded(true)}
      >
        <div className="flex h-full items-center justify-between">
          {/* Collapsed State Content */}
          <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 transition-opacity duration-300 ${expanded ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-500">TradePro</span>
          </div>

          {/* Expanded State Content */}
          <div className={`w-full flex items-center gap-4 transition-all duration-500 delay-100 ${expanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 truncate">{activeToast?.title}</h4>
              <p className="text-xs text-gray-500 truncate">{activeToast?.message}</p>
            </div>
            <button
              onClick={() => { setExpanded(false); setTimeout(() => onRemove(activeToast?.id), 300); }}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicIsland;
