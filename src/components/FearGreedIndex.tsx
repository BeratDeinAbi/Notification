import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw } from 'lucide-react';

interface FearGreedData {
  value: number;
  valueClassification: string;
  timestamp: Date;
  previousValue?: number;
  previousClassification?: string;
}

const FearGreedIndex: React.FC = () => {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFearGreed = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch current and yesterday's data
      const res = await fetch('https://api.alternative.me/fng/?limit=2');
      const json = await res.json();

      if (json.data && json.data.length > 0) {
        const current = json.data[0];
        const previous = json.data[1];

        setData({
          value: parseInt(current.value),
          valueClassification: current.value_classification,
          timestamp: new Date(parseInt(current.timestamp) * 1000),
          previousValue: previous ? parseInt(previous.value) : undefined,
          previousClassification: previous?.value_classification
        });
      }
    } catch (e) {
      setError('Konnte Fear & Greed Index nicht laden');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFearGreed();
    // Update every 5 minutes
    const interval = setInterval(fetchFearGreed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getColor = (value: number) => {
    if (value <= 25) return { bg: 'bg-rose-500', text: 'text-rose-500', glow: 'shadow-rose-500/30' };
    if (value <= 45) return { bg: 'bg-orange-500', text: 'text-orange-500', glow: 'shadow-orange-500/30' };
    if (value <= 55) return { bg: 'bg-yellow-500', text: 'text-yellow-500', glow: 'shadow-yellow-500/30' };
    if (value <= 75) return { bg: 'bg-lime-500', text: 'text-lime-500', glow: 'shadow-lime-500/30' };
    return { bg: 'bg-emerald-500', text: 'text-emerald-500', glow: 'shadow-emerald-500/30' };
  };

  const getLabel = (classification: string) => {
    switch (classification.toLowerCase()) {
      case 'extreme fear': return 'Extreme Angst';
      case 'fear': return 'Angst';
      case 'neutral': return 'Neutral';
      case 'greed': return 'Gier';
      case 'extreme greed': return 'Extreme Gier';
      default: return classification;
    }
  };

  const getTradingHint = (value: number) => {
    if (value <= 25) return { icon: TrendingUp, text: 'Potenzielle Kaufgelegenheit - Markt ist sehr ängstlich', color: 'text-cyan-400' };
    if (value <= 45) return { icon: AlertCircle, text: 'Vorsichtig kaufen - Markt ist unsicher', color: 'text-orange-400' };
    if (value <= 55) return { icon: Minus, text: 'Abwarten - Markt ist neutral', color: 'text-yellow-400' };
    if (value <= 75) return { icon: AlertCircle, text: 'Vorsichtig sein - Markt wird gierig', color: 'text-lime-400' };
    return { icon: TrendingDown, text: 'Potenzielle Verkaufsgelegenheit - Markt ist überhitzt', color: 'text-rose-400' };
  };

  if (loading && !data) {
    return (
      <div className="bg-surface rounded-2xl border border-subtle p-6 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-surface rounded-2xl border border-subtle p-6">
        <div className="text-rose-400 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const colors = getColor(data.value);
  const hint = getTradingHint(data.value);
  const HintIcon = hint.icon;
  const change = data.previousValue ? data.value - data.previousValue : 0;

  return (
    <div className="h-full w-full p-6 relative overflow-hidden flex flex-col">
      {/* Background Glow */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 ${colors.bg} opacity-10 rounded-full blur-3xl`}></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6 z-10">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            Fear & Greed
            <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded border border-white/5">Krypto</span>
          </h3>
          <p className="text-slate-400 text-xs mt-1">Marktstimmung der letzten 24h</p>
        </div>
        <button
          onClick={fetchFearGreed}
          className="text-slate-500 hover:text-white transition-colors p-1"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Display - Centered */}
      <div className="flex-1 flex flex-col justify-center items-center gap-6 mb-4 z-10">
        {/* Gauge */}
        <div className="relative">
          <div className={`w-36 h-36 rounded-full border-4 ${colors.bg} border-opacity-20 flex items-center justify-center shadow-[0_0_30px_-10px_var(--tw-shadow-color)] ${colors.glow}`}>
            <div className="text-center">
              <span className={`text-5xl font-bold tracking-tighter ${colors.text} drop-shadow-sm`}>{data.value}</span>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest block mt-1">Index</span>
            </div>
          </div>
          {/* Decorative Ring */}
          <div className="absolute inset-0 rounded-full border border-white/5 scale-110"></div>
        </div>

        {/* Info */}
        <div className="text-center">
          <div className={`text-2xl font-bold ${colors.text} mb-2 tracking-tight`}>
            {getLabel(data.valueClassification)}
          </div>

          {/* Change from yesterday */}
          {data.previousValue !== undefined && (
            <div className="flex items-center justify-center gap-3 text-sm bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <span className="text-slate-400 text-xs">Gestern: {data.previousValue}</span>
              <div className="w-px h-3 bg-white/10"></div>
              <span className={`flex items-center gap-1 font-bold ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {change > 0 ? <TrendingUp size={12} /> : change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                {change > 0 ? '+' : ''}{change}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto z-10">
        <div className={`flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10`}>
          <HintIcon size={18} className={`${hint.color} mt-0.5 shrink-0`} />
          <span className={`text-sm font-medium ${hint.color} leading-snug`}>{hint.text}</span>
        </div>
      </div>
    </div>
  );
};

export default FearGreedIndex;
