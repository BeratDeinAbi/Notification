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
  const [selectedCrypto, setSelectedCrypto] = useState('BTCUSDT');
  const [timeframeDays, setTimeframeDays] = useState(90);
  const [rsiTimeframe, setRsiTimeframe] = useState<'4h' | '1d'>('4h');
  const [rsiThreshold, setRsiThreshold] = useState(30);
  const [rsiCondition, setRsiCondition] = useState<'below' | 'above'>('below');
  const [takeProfit, setTakeProfit] = useState(10);
  const [stopLoss, setStopLoss] = useState(10);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const candlesPerDay = rsiTimeframe === '4h' ? 6 : 1;
      const limit = Math.min(timeframeDays * candlesPerDay, 1000);
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${selectedCrypto}&interval=${rsiTimeframe}&limit=${limit}`
      );
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Keine Daten verfügbar');
      }

      const candles = data.map((c: any) => ({
        timestamp: new Date(c[0]),
        open: parseFloat(c[1]),
        high: parseFloat(c[2]),
        low: parseFloat(c[3]),
        close: parseFloat(c[4]),
      }));

      const closes = candles.map((c: any) => c.close);
      const rsiValues = RSI.calculate({ values: closes, period: 14 });

      const candlesWithRsi = candles.slice(14).map((candle: any, i: number) => ({
        ...candle,
        rsi: rsiValues[i],
      }));

      const trades: Trade[] = [];
      let inTrade = false;
      let entryCandle: any = null;
      let entryRsi: number = 0;

      for (let i = 0; i < candlesWithRsi.length; i++) {
        const candle = candlesWithRsi[i];

        if (!inTrade) {
          const shouldEnter = rsiCondition === 'below'
            ? candle.rsi < rsiThreshold
            : candle.rsi > rsiThreshold;

          if (shouldEnter) {
            inTrade = true;
            entryCandle = candle;
            entryRsi = candle.rsi;
          }
        } else {
          const priceChange = ((candle.close - entryCandle.close) / entryCandle.close) * 100;

          if (priceChange >= takeProfit) {
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
        trades: trades.slice(-20).reverse(),
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
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <BarChart3 className="text-gray-500" size={28} />
          Backtesting Simulator
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Validiere deine Strategien mit echten historischen Marktdaten.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

        {/* Settings Panel */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
            <h2 className="text-gray-900 font-bold mb-6 flex items-center gap-2 text-lg">
              <Activity size={20} className="text-gray-500" />
              Konfiguration
            </h2>

            <div className="space-y-6">
              {/* Asset & Time */}
              <div className="space-y-4">
                <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Markt & Zeit</label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <select
                      value={selectedCrypto}
                      onChange={(e) => setSelectedCrypto(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-gray-900 focus:border-gray-400 focus:outline-none transition-all hover:bg-gray-100"
                    >
                      {CRYPTO_OPTIONS.map((c) => (
                        <option key={c.symbol} value={c.symbol}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={timeframeDays}
                    onChange={(e) => setTimeframeDays(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-gray-900 focus:border-gray-400 focus:outline-none hover:bg-gray-100 transition-all text-sm"
                  >
                    <option value={7}>7 Tage</option>
                    <option value={30}>30 Tage</option>
                    <option value={90}>90 Tage</option>
                    <option value={180}>180 Tage</option>
                  </select>

                  <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                    {(['4h', '1d'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setRsiTimeframe(tf)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${rsiTimeframe === tf ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-700'}`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full"></div>

              {/* Strategy Parameters */}
              <div className="space-y-4">
                <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Strategie Logik</label>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-700">Kaufe wenn RSI</span>
                    <select
                      value={rsiCondition}
                      onChange={(e) => setRsiCondition(e.target.value as 'below' | 'above')}
                      className="bg-transparent border-b border-gray-900 text-gray-900 font-bold focus:outline-none text-center"
                    >
                      <option value="below">unter</option>
                      <option value="above">über</option>
                    </select>
                  </div>

                  <div className="relative pt-6 pb-2">
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={rsiThreshold}
                      onChange={(e) => setRsiThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                    />
                    <div className="absolute top-0 left-0 w-full flex justify-between text-xs text-gray-400 font-mono">
                      <span>10</span>
                      <span className="text-gray-900 font-bold text-base -mt-1">{rsiThreshold}</span>
                      <span>90</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full"></div>

              {/* Risk Management */}
              <div className="space-y-4">
                <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Risiko Management</label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-2">
                      <Target size={14} /> Take Profit
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                        className="w-full bg-transparent text-gray-900 font-mono font-bold text-lg focus:outline-none border-b border-gray-200 focus:border-emerald-500"
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <label className="flex items-center gap-2 text-xs font-bold text-rose-600 mb-2">
                      <StopCircle size={14} /> Stop Loss
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(Number(e.target.value))}
                        className="w-full bg-transparent text-gray-900 font-mono font-bold text-lg focus:outline-none border-b border-gray-200 focus:border-rose-500"
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={runBacktest}
                disabled={loading}
                className="w-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 text-lg"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} fill="white" />}
                {loading ? 'Analysiere Daten...' : 'Simulation Starten'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="xl:col-span-2 space-y-6">
          {!result && !loading && !error && (
            <div className="bg-white rounded-3xl border border-gray-100 border-dashed p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px] shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <BarChart3 className="text-gray-300" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Bereit für Analyse</h3>
              <p className="text-gray-500 max-w-md mx-auto">Wähle deine Parameter auf der linken Seite und starte die Simulation, um zu sehen, wie deine Strategie performt hätte.</p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px] shadow-sm">
              <Loader2 className="text-gray-400 animate-spin mb-6" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-1">Verarbeite historische Daten...</h3>
              <p className="text-gray-500">Dies kann einen Moment dauern</p>
            </div>
          )}

          {error && (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600">
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
                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col shadow-sm">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Win Rate</span>
                  <span className={`text-3xl font-bold ${result.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {result.winRate.toFixed(1)}%
                  </span>
                  <div className="w-full bg-gray-100 h-1 mt-auto rounded-full overflow-hidden">
                    <div className={`h-full ${result.winRate >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${result.winRate}%` }}></div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col shadow-sm">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Profit</span>
                  <span className={`text-3xl font-bold ${result.totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {result.totalProfit >= 0 ? '+' : ''}{result.totalProfit.toFixed(2)}%
                  </span>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col shadow-sm">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Trades</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{result.totalTrades}</span>
                    <span className="text-emerald-500 text-sm font-bold">{result.winningTrades} W</span>
                    <span className="text-rose-500 text-sm font-bold">{result.losingTrades} L</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col shadow-sm">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Risiko/Reward</span>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Ø Win</span>
                      <span className="text-emerald-500 font-mono">+{result.averageProfit.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Ø Loss</span>
                      <span className="text-rose-500 font-mono">{result.averageLoss.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade History Table */}
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-900">Letzte Trades</h3>
                  <span className="text-xs text-gray-400 font-mono">{result.trades.length} angezeigt</span>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="text-xs uppercase text-gray-400 font-medium bg-gray-50/80 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Datum</th>
                        <th className="px-6 py-3">Signal</th>
                        <th className="px-6 py-3 text-right">Einstieg &rarr; Ausstieg</th>
                        <th className="px-6 py-3 text-right">Ergebnis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {result.trades.map((trade, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">
                            {new Date(trade.entryDate).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-700">RSI {trade.rsiAtEntry.toFixed(0)}</span>
                              <span className="text-[10px] text-gray-400">{trade.exitReason === 'take-profit' ? 'TP Hit' : 'SL Hit'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs">
                            <div className="text-gray-500">${trade.entryPrice.toLocaleString()}</div>
                            <div className="text-gray-300">↓</div>
                            <div className="text-gray-900">${trade.exitPrice.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center gap-1 font-bold font-mono px-2 py-1 rounded-lg ${trade.outcome === 'win' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
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
