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
    const interval = setInterval(fetchFearGreed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getColor = (value: number) => {
    if (value <= 25) return { bg: 'bg-rose-500', text: 'text-rose-600', ring: 'border-rose-400' };
    if (value <= 45) return { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'border-orange-400' };
    if (value <= 55) return { bg: 'bg-yellow-500', text: 'text-yellow-600', ring: 'border-yellow-400' };
    if (value <= 75) return { bg: 'bg-lime-500', text: 'text-lime-600', ring: 'border-lime-400' };
    return { bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'border-emerald-400' };
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
    if (value <= 25) return { icon: TrendingUp, text: 'Potenzielle Kaufgelegenheit - Markt ist sehr ängstlich', color: 'text-emerald-600' };
    if (value <= 45) return { icon: AlertCircle, text: 'Vorsichtig kaufen - Markt ist unsicher', color: 'text-orange-600' };
    if (value <= 55) return { icon: Minus, text: 'Abwarten - Markt ist neutral', color: 'text-yellow-600' };
    if (value <= 75) return { icon: AlertCircle, text: 'Vorsichtig sein - Markt wird gierig', color: 'text-lime-600' };
    return { icon: TrendingDown, text: 'Potenzielle Verkaufsgelegenheit - Markt ist überhitzt', color: 'text-rose-600' };
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="text-rose-500 flex items-center gap-2">
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
      {/* Header */}
      <div className="flex justify-between items-start mb-6 z-10">
        <div>
          <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
            Fear & Greed
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">Krypto</span>
          </h3>
          <p className="text-gray-400 text-xs mt-1">Marktstimmung der letzten 24h</p>
        </div>
        <button
          onClick={fetchFearGreed}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Display - Centered */}
      <div className="flex-1 flex flex-col justify-center items-center gap-6 mb-4 z-10">
        {/* Gauge */}
        <div className="relative">
          <div className={`w-36 h-36 rounded-full border-4 ${colors.ring} flex items-center justify-center`}>
            <div className="text-center">
              <span className={`text-5xl font-bold tracking-tighter ${colors.text} drop-shadow-sm`}>{data.value}</span>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest block mt-1">Index</span>
            </div>
          </div>
          {/* Decorative Ring */}
          <div className="absolute inset-0 rounded-full border border-gray-100 scale-110"></div>
        </div>

        {/* Info */}
        <div className="text-center">
          <div className={`text-2xl font-bold ${colors.text} mb-2 tracking-tight`}>
            {getLabel(data.valueClassification)}
          </div>

          {/* Change from yesterday */}
          {data.previousValue !== undefined && (
            <div className="flex items-center justify-center gap-3 text-sm bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <span className="text-gray-400 text-xs">Gestern: {data.previousValue}</span>
              <div className="w-px h-3 bg-gray-200"></div>
              <span className={`flex items-center gap-1 font-bold ${change > 0 ? 'text-emerald-500' : change < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                {change > 0 ? <TrendingUp size={12} /> : change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                {change > 0 ? '+' : ''}{change}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto z-10">
        <div className={`flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 transition-all hover:bg-gray-100`}>
          <HintIcon size={18} className={`${hint.color} mt-0.5 shrink-0`} />
          <span className={`text-sm font-medium ${hint.color} leading-snug`}>{hint.text}</span>
        </div>
      </div>
    </div>
  );
};

export default FearGreedIndex;
