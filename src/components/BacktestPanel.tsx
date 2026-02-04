import React, { useState } from 'react';
import { Play, TrendingUp, TrendingDown, Target, StopCircle, Activity, Loader2, BarChart3, XCircle } from 'lucide-react';
import * as TechnicalIndicators from 'technicalindicators';

const RSI = TechnicalIndicators.RSI;

interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  averageProfit: number;
  averageLoss: number;
  maxProfit: number;
  maxLoss: number;
  trades: Trade[];
}

interface Trade {
  entryDate: Date;
  exitDate: Date;
  entryPrice: number;
  exitPrice: number;
  rsiAtEntry: number;
  profitPercent: number;
  outcome: 'win' | 'loss';
  exitReason: 'take-profit' | 'stop-loss';
}

const CRYPTO_OPTIONS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'BNBUSDT', name: 'BNB' },
  { symbol: 'SOLUSDT', name: 'Solana' },
  { symbol: 'XRPUSDT', name: 'XRP' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin' },
  { symbol: 'ADAUSDT', name: 'Cardano' },
  { symbol: 'AVAXUSDT', name: 'Avalanche' },
  { symbol: 'DOTUSDT', name: 'Polkadot' },
  { symbol: 'LINKUSDT', name: 'Chainlink' },
  { symbol: 'MATICUSDT', name: 'Polygon' },
  { symbol: 'LTCUSDT', name: 'Litecoin' },
];

const BacktestPanel: React.FC = () => {
  // Settings
  const [selectedCrypto, setSelectedCrypto] = useState('BTCUSDT');
  const [timeframeDays, setTimeframeDays] = useState(90);
  const [rsiTimeframe, setRsiTimeframe] = useState<'4h' | '1d'>('4h');
  const [rsiThreshold, setRsiThreshold] = useState(30);
  const [rsiCondition, setRsiCondition] = useState<'below' | 'above'>('below');
  const [takeProfit, setTakeProfit] = useState(10);
  const [stopLoss, setStopLoss] = useState(10);

  // State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fetch historical data from Binance based on selected RSI timeframe
      // For 4h: 6 candles per day, for 1d: 1 candle per day
      const candlesPerDay = rsiTimeframe === '4h' ? 6 : 1;
      const limit = Math.min(timeframeDays * candlesPerDay, 1000); // Binance limit is 1000
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${selectedCrypto}&interval=${rsiTimeframe}&limit=${limit}`
      );
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Keine Daten verfügbar');
      }

      // Extract close prices and timestamps
      const candles = data.map((c: any) => ({
        timestamp: new Date(c[0]),
        open: parseFloat(c[1]),
        high: parseFloat(c[2]),
        low: parseFloat(c[3]),
        close: parseFloat(c[4]),
      }));

      // Calculate RSI for all candles
      const closes = candles.map((c: any) => c.close);
      const rsiValues = RSI.calculate({ values: closes, period: 14 });

      // Align RSI with candles (RSI starts after 14 periods)
      const candlesWithRsi = candles.slice(14).map((candle: any, i: number) => ({
        ...candle,
        rsi: rsiValues[i],
      }));

      // Run backtest logic
      const trades: Trade[] = [];
      let inTrade = false;
      let entryCandle: any = null;
      let entryRsi: number = 0;

      for (let i = 0; i < candlesWithRsi.length; i++) {
        const candle = candlesWithRsi[i];

        if (!inTrade) {
          // Check entry condition
          const shouldEnter = rsiCondition === 'below'
            ? candle.rsi < rsiThreshold
            : candle.rsi > rsiThreshold;

          if (shouldEnter) {
            inTrade = true;
            entryCandle = candle;
            entryRsi = candle.rsi;
          }
        } else {
          // Check exit conditions
          const priceChange = ((candle.close - entryCandle.close) / entryCandle.close) * 100;

          if (priceChange >= takeProfit) {
            // Take profit hit
            trades.push({
              entryDate: entryCandle.timestamp,
              exitDate: candle.timestamp,
              entryPrice: entryCandle.close,
              exitPrice: candle.close,
              rsiAtEntry: entryRsi,
              profitPercent: priceChange,
              outcome: 'win',
              exitReason: 'take-profit',
            });
            inTrade = false;
          } else if (priceChange <= -stopLoss) {
            // Stop loss hit
            trades.push({
              entryDate: entryCandle.timestamp,
              exitDate: candle.timestamp,
              entryPrice: entryCandle.close,
              exitPrice: candle.close,
              rsiAtEntry: entryRsi,
              profitPercent: priceChange,
              outcome: 'loss',
              exitReason: 'stop-loss',
            });
            inTrade = false;
          }
        }
      }

      // Calculate statistics
      const winningTrades = trades.filter(t => t.outcome === 'win');
      const losingTrades = trades.filter(t => t.outcome === 'loss');
      const totalProfit = trades.reduce((sum, t) => sum + t.profitPercent, 0);

      const avgProfit = winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + t.profitPercent, 0) / winningTrades.length
        : 0;
      const avgLoss = losingTrades.length > 0
        ? losingTrades.reduce((sum, t) => sum + t.profitPercent, 0) / losingTrades.length
        : 0;

      setResult({
        totalTrades: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
        totalProfit,
        averageProfit: avgProfit,
        averageLoss: avgLoss,
        maxProfit: trades.length > 0 ? Math.max(...trades.map(t => t.profitPercent)) : 0,
        maxLoss: trades.length > 0 ? Math.min(...trades.map(t => t.profitPercent)) : 0,
        trades: trades.slice(-20).reverse(), // Last 20 trades
      });
    } catch (e: any) {
      setError(e.message || 'Fehler beim Backtesting');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight flex items-center gap-3">
          <BarChart3 className="text-primary" size={28} />
          Backtesting Simulator
        </h1>
        <p className="text-slate-400 mt-2 text-lg">Validiere deine Strategien mit echten historischen Marktdaten.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

        {/* Settings Panel */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10"></div>

            <h2 className="text-white font-bold mb-6 flex items-center gap-2 text-lg">
              <Activity size={20} className="text-primary" />
              Konfiguration
            </h2>

            <div className="space-y-6">
              {/* Asset & Time */}
              <div className="space-y-4">
                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Markt & Zeit</label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <select
                      value={selectedCrypto}
                      onChange={(e) => setSelectedCrypto(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-primary focus:outline-none transition-all hover:bg-white/10"
                    >
                      {CRYPTO_OPTIONS.map((c) => (
                        <option key={c.symbol} value={c.symbol} className="bg-slate-900">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={timeframeDays}
                    onChange={(e) => setTimeframeDays(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-primary focus:outline-none hover:bg-white/10 transition-all text-sm"
                  >
                    <option value={7} className="bg-slate-900">7 Tage</option>
                    <option value={30} className="bg-slate-900">30 Tage</option>
                    <option value={90} className="bg-slate-900">90 Tage</option>
                    <option value={180} className="bg-slate-900">180 Tage</option>
                  </select>

                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    {(['4h', '1d'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setRsiTimeframe(tf)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${rsiTimeframe === tf ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5 w-full"></div>

              {/* Strategy Parameters */}
              <div className="space-y-4">
                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Strategie Logik</label>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-slate-300">Kaufe wenn RSI</span>
                    <select
                      value={rsiCondition}
                      onChange={(e) => setRsiCondition(e.target.value as 'below' | 'above')}
                      className="bg-transparent border-b border-primary text-primary font-bold focus:outline-none text-center"
                    >
                      <option value="below" className="bg-slate-900">unter</option>
                      <option value="above" className="bg-slate-900">über</option>
                    </select>
                  </div>

                  <div className="relative pt-6 pb-2">
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={rsiThreshold}
                      onChange={(e) => setRsiThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="absolute top-0 left-0 w-full flex justify-between text-xs text-slate-500 font-mono">
                      <span>10</span>
                      <span className="text-primary font-bold text-base -mt-1">{rsiThreshold}</span>
                      <span>90</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5 w-full"></div>

              {/* Risk Management */}
              <div className="space-y-4">
                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Risiko Management</label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                      <Target size={14} /> Take Profit
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                        className="w-full bg-transparent text-white font-mono font-bold text-lg focus:outline-none border-b border-white/10 focus:border-emerald-500"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                    <label className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-2">
                      <StopCircle size={14} /> Stop Loss
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(Number(e.target.value))}
                        className="w-full bg-transparent text-white font-mono font-bold text-lg focus:outline-none border-b border-white/10 focus:border-rose-500"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={runBacktest}
                disabled={loading}
                className="w-full bg-white text-black hover:bg-slate-200 disabled:opacity-50 font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center justify-center gap-3 text-lg"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} fill="black" />}
                {loading ? 'Analysiere Daten...' : 'Simulation Starten'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="xl:col-span-2 space-y-6">
          {!result && !loading && !error && (
            <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px] border-dashed border-white/10">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <BarChart3 className="text-slate-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Bereit für Analyse</h3>
              <p className="text-slate-400 max-w-md mx-auto">Wähle deine Parameter auf der linken Seite und starte die Simulation, um zu sehen, wie deine Strategie performt hätte.</p>
            </div>
          )}

          {loading && (
            <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <Loader2 className="text-primary animate-spin mb-6" size={48} />
              <h3 className="text-xl font-bold text-white mb-1">Verarbeite historische Daten...</h3>
              <p className="text-slate-400">Dies kann einen Moment dauern</p>
            </div>
          )}

          {error && (
            <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-4 text-rose-200">
              <XCircle size={24} />
              <div>
                <h4 className="font-bold">Fehler aufgetreten</h4>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-slide-up">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl flex flex-col">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Win Rate</span>
                  <span className={`text-3xl font-bold ${result.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.winRate.toFixed(1)}%
                  </span>
                  <div className="w-full bg-white/10 h-1 mt-auto rounded-full overflow-hidden">
                    <div className={`h-full ${result.winRate >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${result.winRate}%` }}></div>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl flex flex-col">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Profit</span>
                  <span className={`text-3xl font-bold ${result.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.totalProfit >= 0 ? '+' : ''}{result.totalProfit.toFixed(2)}%
                  </span>
                </div>

                <div className="glass-panel p-5 rounded-2xl flex flex-col">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Trades</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{result.totalTrades}</span>
                    <span className="text-emerald-400 text-sm font-bold">{result.winningTrades} W</span>
                    <span className="text-rose-400 text-sm font-bold">{result.losingTrades} L</span>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl flex flex-col">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Risiko/Reward</span>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Ø Win</span>
                      <span className="text-emerald-400 font-mono">+{result.averageProfit.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Ø Loss</span>
                      <span className="text-rose-400 font-mono">{result.averageLoss.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade History Table */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h3 className="font-bold text-white">Letzte Trades</h3>
                  <span className="text-xs text-slate-400 font-mono">{result.trades.length} angezeigt</span>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs uppercase text-slate-500 font-medium bg-black/20 sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="px-6 py-3">Datum</th>
                        <th className="px-6 py-3">Signal</th>
                        <th className="px-6 py-3 text-right">Einstieg &rarr; Ausstieg</th>
                        <th className="px-6 py-3 text-right">Ergebnis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {result.trades.map((trade, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">
                            {new Date(trade.entryDate).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-primary">RSI {trade.rsiAtEntry.toFixed(0)}</span>
                              <span className="text-[10px] text-slate-500">{trade.exitReason === 'take-profit' ? 'TP Hit' : 'SL Hit'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs">
                            <div className="text-slate-300">${trade.entryPrice.toLocaleString()}</div>
                            <div className="text-slate-500">↓</div>
                            <div className="text-white">${trade.exitPrice.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center gap-1 font-bold font-mono px-2 py-1 rounded-lg ${trade.outcome === 'win' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {trade.outcome === 'win' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {trade.profitPercent >= 0 ? '+' : ''}{trade.profitPercent.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BacktestPanel;
