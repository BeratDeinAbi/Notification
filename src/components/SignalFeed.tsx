import React from 'react';
import type { Signal } from '../types';
import { Bell, ArrowUp, ArrowDown, Activity, Trash2, X } from 'lucide-react';

interface SignalFeedProps {
  signals: Signal[];
  onDeleteSignal?: (id: string) => void;
  onClearAllSignals?: () => void;
}

const SignalFeed: React.FC<SignalFeedProps> = ({ signals, onDeleteSignal, onClearAllSignals }) => {
  if (signals.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
        <Bell size={48} className="mb-4 opacity-20" />
        <p className="font-medium text-gray-500">Keine Signale gefunden.</p>
        <p className="text-xs mt-2 text-gray-400 text-center max-w-[200px]">Konfiguriere Regeln oder warte auf Marktbewegungen.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Activity size={18} className="text-gray-500" /> Aktuelle Signale</h3>
        {onClearAllSignals && signals.length > 0 && (
          <button
            onClick={onClearAllSignals}
            className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors flex items-center gap-1.5 border border-rose-100"
          >
            <Trash2 size={12} /> Alle leeren
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
        {signals.map((signal) => (
          <div key={signal.id} className="p-4 hover:bg-gray-50/50 transition-colors animate-signal-enter group">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${signal.type === 'BULLISH' ? 'bg-emerald-50 text-emerald-500' : signal.type === 'BEARISH' ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-500'}`}>
                  {signal.type === 'BULLISH' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    {signal.assetSymbol}
                    <span className="text-xs font-normal text-gray-400 bg-gray-100 border border-gray-200 px-1.5 rounded">{signal.timeframe}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{signal.message}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-400 font-mono">{signal.timestamp.toLocaleTimeString()}</div>
                {onDeleteSignal && (
                  <button
                    onClick={() => onDeleteSignal(signal.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Signal löschen"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SignalFeed;
