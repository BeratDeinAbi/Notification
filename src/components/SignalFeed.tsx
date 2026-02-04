import React from 'react';
import type { Signal } from '../types';
import { Bell, ArrowUp, ArrowDown, Activity } from 'lucide-react';

const SignalFeed: React.FC<{ signals: Signal[] }> = ({ signals }) => {
  if (signals.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-zinc-600 bg-surface rounded-lg border border-subtle border-dashed">
        <Bell size={48} className="mb-4 opacity-10" />
        <p className="font-medium">Keine Signale gefunden.</p>
        <p className="text-xs mt-2 text-zinc-500 text-center max-w-[200px]">Konfiguriere Regeln oder warte auf Marktbewegungen.</p>
      </div>
    );
  }
  return (
    <div className="bg-surface rounded-lg border border-subtle shadow-sm overflow-hidden">
      <div className="p-4 border-b border-subtle bg-zinc-900/50">
        <h3 className="font-semibold text-zinc-100 flex items-center gap-2"><Activity size={18} className="text-primary" /> Aktuelle Signale</h3>
      </div>
      <div className="divide-y divide-subtle max-h-[500px] overflow-y-auto">
        {signals.map((signal) => (
          <div key={signal.id} className="p-4 hover:bg-zinc-800/30 transition-colors animate-fade-in">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${signal.type === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-500' : signal.type === 'BEARISH' ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800 text-zinc-500'}`}>
                  {signal.type === 'BULLISH' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                </div>
                <div>
                  <div className="font-bold text-zinc-200 flex items-center gap-2">
                    {signal.assetSymbol}
                    <span className="text-xs font-normal text-zinc-500 bg-zinc-800 border border-zinc-700 px-1.5 rounded">{signal.timeframe}</span>
                  </div>
                  <div className="text-sm text-zinc-400 mt-0.5">{signal.message}</div>
                </div>
              </div>
              <div className="text-xs text-zinc-600 font-mono">{signal.timestamp.toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SignalFeed;
