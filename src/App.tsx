// ... imports remain the same
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Asset, AlertRule, Signal, Timeframe, RuleCondition, AssetType } from './types';
import { INITIAL_ASSETS } from './constants';
import AssetTable from './components/AssetTable';
import RuleBuilder from './components/RuleBuilder';
import SignalFeed from './components/SignalFeed';
import Sidebar from './components/Sidebar';
import DonationModal from './components/DonationModal';
import PortfolioTracker from './components/PortfolioTracker';
import FearGreedIndex from './components/FearGreedIndex';
import BacktestPanel from './components/BacktestPanel';
import DynamicIsland from './components/DynamicIsland';
import type { ToastProps } from './components/DynamicIsland';
import WhaleFeed from './components/WhaleFeed';
import SentimentIndicator from './components/SentimentIndicator';
import StrategyGuide from './components/StrategyGuide';
import RSIHeatmap from './components/RSIHeatmap';
import { Layers, Plus, RefreshCw, Loader2, BellOff, Edit3, Trash2, CheckCircle, Clock, BellRing, LayoutGrid, List, Sun, Moon } from 'lucide-react';
import MobileNavbar from './components/MobileNavbar';


// ... helper functions (calculateRSI, calculateMACD, load functions) remain the same

// Helper Functions
const calculateRSI = (prices: number[], period: number = 14) => {
  if (prices.length < period + 1) return Array(prices.length).fill(50);

  let gains = 0, losses = 0;

  // First period
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const rsiValues = Array(period).fill(0); // Pad beginning
  rsiValues.push(100 - (100 / (1 + (avgGain / (avgLoss === 0 ? 1 : avgLoss)))));

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss);
    rsiValues.push(100 - (100 / (1 + rs)));
  }
  return rsiValues;
};

const calculateMACD = (prices: number[]) => {
  const ema = (data: number[], span: number) => {
    const k = 2 / (span + 1);
    let res = [data[0]];
    for (let i = 1; i < data.length; i++) {
      res.push(data[i] * k + res[i - 1] * (1 - k));
    }
    return res;
  };

  const fast = ema(prices, 12);
  const slow = ema(prices, 26);
  const macdLine = fast.map((v, i) => v - slow[i]);
  const signalLine = ema(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);

  return macdLine.map((v, i) => ({
    MACD: v,
    signal: signalLine[i],
    histogram: histogram[i]
  }));
};

const CRYPTO_SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', id: 'btc' }, { symbol: 'ETHUSDT', name: 'Ethereum', id: 'eth' }, { symbol: 'BNBUSDT', name: 'Binance Coin', id: 'bnb' },
  { symbol: 'SOLUSDT', name: 'Solana', id: 'sol' }, { symbol: 'XRPUSDT', name: 'Ripple', id: 'xrp' }, { symbol: 'DOGEUSDT', name: 'Dogecoin', id: 'doge' },
  { symbol: 'ADAUSDT', name: 'Cardano', id: 'ada' }, { symbol: 'AVAXUSDT', name: 'Avalanche', id: 'avax' }, { symbol: 'SHIBUSDT', name: 'Shiba Inu', id: 'shib' },
  { symbol: 'DOTUSDT', name: 'Polkadot', id: 'dot' }, { symbol: 'LINKUSDT', name: 'Chainlink', id: 'link' }, { symbol: 'TRXUSDT', name: 'Tron', id: 'trx' },
  { symbol: 'MATICUSDT', name: 'Polygon', id: 'matic' }, { symbol: 'LTCUSDT', name: 'Litecoin', id: 'ltc' }, { symbol: 'NEARUSDT', name: 'Near Protocol', id: 'near' },
  { symbol: 'PAXGUSDT', name: 'Gold (Pax)', id: 'gold' }
];

const STOCK_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple', id: 'aapl' },
  { symbol: 'MSFT', name: 'Microsoft', id: 'msft' },
  { symbol: 'GOOGL', name: 'Google', id: 'googl' },
  { symbol: 'AMZN', name: 'Amazon', id: 'amzn' },
  { symbol: 'TSLA', name: 'Tesla', id: 'tsla' },
  { symbol: 'META', name: 'Meta', id: 'meta' },
  { symbol: 'NVDA', name: 'Nvidia', id: 'nvda' }
];

const TWELVE_DATA_API_KEY = '7ec0909c64a74e1baef4ba143b67ec35';

const RULES_STORAGE_KEY = 'notification_app_rules';
const SIGNALS_STORAGE_KEY = 'notification_app_signals';

const loadRulesFromStorage = (): AlertRule[] => {
  try {
    const stored = localStorage.getItem(RULES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((r: any) => ({
        ...r,
        triggeredAt: r.triggeredAt ? new Date(r.triggeredAt) : undefined
      }));
    }
  } catch (e) {
    console.error('Failed to load rules from storage:', e);
  }
  return [{ id: '1', assetId: 'ALL_CRYPTO', timeframe: '4h', indicator: 'RSI', operator: 'LESS_THAN', threshold: 30, active: true, triggered: false }];
};

const loadSignalsFromStorage = (): Signal[] => {
  try {
    const stored = localStorage.getItem(SIGNALS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp)
      }));
    }
  } catch (e) {
    console.error('Failed to load signals from storage:', e);
  }
  return [];
};


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RULES' | 'PORTFOLIO' | 'BACKTEST' | 'STRATEGIES' | 'RSI_MAP'>('DASHBOARD');
  const [dashboardView, setDashboardView] = useState<'STATS' | 'PRICES'>('PRICES'); // Default to Prices as requested
  const [marketFilter, setMarketFilter] = useState<'CRYPTO' | 'STOCK' | 'COMMODITY'>('CRYPTO');
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('4h');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [signals, setSignals] = useState<Signal[]>(loadSignalsFromStorage);
  const [rules, setRules] = useState<AlertRule[]>(loadRulesFromStorage);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [showDonationModal, setShowDonationModal] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const prevAssetsRef = useRef<Asset[]>([]);

  // Effects and Logic remain mostly the same, just UI changes
  useEffect(() => { localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules)); }, [rules]);
  useEffect(() => { localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(signals)); }, [signals]);

  const addToast = (title: string, message: string, type: ToastProps['type'] = 'info') => {
    const newToast: ToastProps = { id: Date.now().toString(), title, message, type };
    setToasts(prev => [newToast, ...prev].slice(0, 3));
    if (document.hidden && notificationPermission === 'granted') {
      new Notification(title, { body: message, icon: '📊' });
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') addToast('Benachrichtigungen aktiv ✅', 'Du erhältst jetzt Alarme.', 'success');
  };

  useEffect(() => { if ('Notification' in window) setNotificationPermission(Notification.permission); }, []);

  // ... checkCondition and checkAlarms logic (omitted for brevity, assume unchanged)
  // Central Logic for Checking a Single Condition
  const checkCondition = (asset: Asset, condition: RuleCondition, timeframe: Timeframe, prevAsset?: Asset): { triggered: boolean, value?: number } => {
    let currentValue: number | undefined;

    if (condition.indicator === 'RSI') {
      const rsiValue = asset.rsi?.[timeframe];
      if (rsiValue !== undefined) {
        currentValue = rsiValue;
        if (condition.operator === 'LESS_THAN' && rsiValue < (condition.threshold ?? 30)) return { triggered: true, value: rsiValue };
        if (condition.operator === 'GREATER_THAN' && rsiValue > (condition.threshold ?? 70)) return { triggered: true, value: rsiValue };
      }
    } else if (condition.indicator === 'MACD') {
      const macdData = asset.macd?.[timeframe];
      const prevMacdData = prevAsset?.macd?.[timeframe];

      if (macdData) {
        currentValue = macdData.histogram;
        if (condition.operator === 'CROSS_ABOVE' && prevMacdData && prevMacdData.histogram < 0 && macdData.histogram >= 0) return { triggered: true, value: currentValue };
        if (condition.operator === 'CROSS_BELOW' && prevMacdData && prevMacdData.histogram > 0 && macdData.histogram <= 0) return { triggered: true, value: currentValue };
        if (condition.operator === 'GREATER_THAN' && macdData.histogram > (condition.threshold ?? 0)) return { triggered: true, value: currentValue };
        if (condition.operator === 'LESS_THAN' && macdData.histogram < (condition.threshold ?? 0)) return { triggered: true, value: currentValue };
      }
    }
    return { triggered: false, value: currentValue };
  };

  const checkAlarms = useCallback((currentAssets: Asset[], previousAssets: Asset[]) => {
    const activeAlarms = rules.filter(r => r.active && !r.triggered);

    activeAlarms.forEach(rule => {
      const assetsToCheck = rule.assetId === 'ALL_CRYPTO'
        ? currentAssets.filter(a => a.type === 'CRYPTO')
        : rule.assetId === 'ALL_STOCKS' ? currentAssets.filter(a => a.type === 'STOCK')
          : currentAssets.filter(a => a.id === rule.assetId);

      assetsToCheck.forEach(asset => {
        const prevAsset = previousAssets.find(a => a.id === asset.id);

        // Define conditions (support legacy and new)
        const conditions = rule.conditions || [{
          id: 'legacy', indicator: rule.indicator, operator: rule.operator, threshold: rule.threshold
        } as RuleCondition];

        const results = conditions.map(c => checkCondition(asset, c, rule.timeframe, prevAsset));

        const isTriggered = rule.logic === 'OR'
          ? results.some(r => r.triggered)
          : results.every(r => r.triggered);

        if (isTriggered) {
          const value = results.find(r => r.triggered)?.value;

          setRules(prev => prev.map(r => r.id === rule.id ? { ...r, triggered: true, triggeredAt: new Date(), triggeredValue: value } : r));

          const message = `${asset.symbol}: Signal auf ${rule.timeframe} ausgelöst!`;
          addToast(`🚨 Alarm: ${asset.symbol}`, message, 'warning');

          setSignals(prev => [{
            id: Date.now().toString(),
            ruleId: rule.id,
            assetSymbol: asset.symbol,
            assetName: asset.name,
            timeframe: rule.timeframe,
            type: 'BULLISH' as const,
            message,
            timestamp: new Date()
          }, ...prev].slice(0, 50));
        }
      });
    });
  }, [rules]);


  const fetchBinanceData = async () => {
    setIsLoading(true);
    try {
      const timeframeToBinance: Record<Timeframe, string> = { '15m': '15m', '2h': '2h', '4h': '4h', '1d': '1d', '1w': '1w' };
      const intervals: Timeframe[] = ['15m', '2h', '4h', '1d', '1w'];

      // Fetch Crypto from Binance
      const cryptoPromises = CRYPTO_SYMBOLS.map(async (coin) => {
        const results: any = {};
        await Promise.all(intervals.map(async (interval) => {
          const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=${timeframeToBinance[interval]}&limit=200`);
          const data = await res.json();
          const closes = data.map((c: any) => parseFloat(c[4]));
          const rsi = calculateRSI(closes, 14);
          const macd = calculateMACD(closes);

          const open = parseFloat(data[data.length - 1][1]);
          const close = parseFloat(data[data.length - 1][4]);

          results[interval] = {
            rsi: rsi[rsi.length - 1],
            macd: { macd: macd[macd.length - 1].MACD, signal: macd[macd.length - 1].signal, histogram: macd[macd.length - 1].histogram },
            change: ((close - open) / open) * 100
          };
          if (interval === '1d') results.price = close;
        }));

        const assetType: AssetType = coin.id === 'gold' ? 'COMMODITY' : 'CRYPTO';

        return {
          id: coin.id, symbol: coin.symbol.replace('USDT', ''), name: coin.name, type: assetType,
          price: results.price || 0, change24h: results['1d'].change || 0,
          change: { '15m': results['15m'].change, '2h': results['2h'].change, '4h': results['4h'].change, '1d': results['1d'].change, '1w': results['1w'].change },
          rsi: { '15m': results['15m'].rsi, '2h': results['2h'].rsi, '4h': results['4h'].rsi, '1d': results['1d'].rsi, '1w': results['1w'].rsi },
          macd: { '15m': results['15m'].macd, '2h': results['2h'].macd, '4h': results['4h'].macd, '1d': results['1d'].macd, '1w': results['1w'].macd }
        } as Asset;
      });

      // Fetch Stocks from Twelve Data - sequential to avoid rate limit (8 req/min on free tier)
      const fetchedStocks: Asset[] = [];
      for (let i = 0; i < STOCK_SYMBOLS.length; i++) {
        const stock = STOCK_SYMBOLS[i];
        try {
          const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${stock.symbol}&interval=1day&outputsize=200&apikey=${TWELVE_DATA_API_KEY}`);
          const data = await res.json();

          if (data.status === 'error' || !data.values) {
            console.warn(`Twelve Data error for ${stock.symbol}:`, data.message);
            continue;
          }

          const closes = data.values.map((v: any) => parseFloat(v.close)).reverse();
          const rsi = calculateRSI(closes, 14);
          const macd = calculateMACD(closes);

          const latestClose = parseFloat(data.values[0].close);
          const prevClose = parseFloat(data.values[1]?.close || data.values[0].close);
          const change = ((latestClose - prevClose) / prevClose) * 100;

          const macdResult = {
            macd: macd[macd.length - 1].MACD,
            signal: macd[macd.length - 1].signal,
            histogram: macd[macd.length - 1].histogram
          };

          fetchedStocks.push({
            id: stock.id, symbol: stock.symbol, name: stock.name, type: 'STOCK' as AssetType,
            price: latestClose, change24h: change,
            change: { '15m': change, '2h': change, '4h': change, '1d': change, '1w': change },
            rsi: { '15m': rsi[rsi.length - 1], '2h': rsi[rsi.length - 1], '4h': rsi[rsi.length - 1], '1d': rsi[rsi.length - 1], '1w': rsi[rsi.length - 1] },
            macd: { '15m': macdResult, '2h': macdResult, '4h': macdResult, '1d': macdResult, '1w': macdResult }
          } as Asset);

          // Delay between requests to avoid rate limit (8 req/min = 7.5s between requests)
          if (i < STOCK_SYMBOLS.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 8000));
          }
        } catch (err) {
          console.error(`Error fetching ${stock.symbol}:`, err);
        }
      }

      const fetchedCryptos = await Promise.all(cryptoPromises);
      const newAssets = [...fetchedCryptos, ...fetchedStocks];

      if (prevAssetsRef.current.length > 0) checkAlarms(newAssets, prevAssetsRef.current);
      prevAssetsRef.current = newAssets;
      setAssets(newAssets);
    } catch (e) {
      console.error(e);
      addToast("Fehler beim Laden", "Konnte Marktdaten nicht abrufen.", "error");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchBinanceData(); const i = setInterval(fetchBinanceData, 60000); return () => clearInterval(i); }, []);

  // Handlers for Rule Management
  const handleDeleteRule = (id: string) => setRules(rules.filter(r => r.id !== id));
  const handleToggleRule = (id: string) => setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const handleResetTriggered = (id: string) => setRules(rules.map(r => r.id === id ? { ...r, triggered: false, triggeredAt: undefined } : r));
  const getAssetLabel = (assetId: string) => assetId === 'ALL_CRYPTO' ? 'Alle Krypto' : assets.find(a => a.id === assetId)?.symbol || assetId;

  const activeRules = rules.filter(r => !r.triggered);
  const triggeredRules = rules.filter(r => r.triggered);

  return (
    <div className={`flex h-screen font-sans overflow-hidden relative selection:bg-cyan-500/30 selection:text-white transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0e17] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>

      <DynamicIsland toasts={toasts} onRemove={removeToast} />

      {/* Background Ambience handled by global CSS on body */}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onOpenSettings={() => { }}
          onOpenDonation={() => setShowDonationModal(true)}
          signalCount={signals.length}
          theme={theme}
        />
      </div>

      {/* Mobile Bottom Navbar */}
      <MobileNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => { }}
        signalCount={signals.length}
      />


      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Modern Header */}
        <header className="px-8 py-6 flex justify-between items-center">
          <div className="flex flex-col gap-3">
            <h1 className={`text-2xl font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {activeTab === 'RULES' ? 'Alarme' : activeTab === 'PORTFOLIO' ? 'Depot Tracker' : activeTab === 'STRATEGIES' ? 'Strategien & Indikatoren' : activeTab === 'BACKTEST' ? 'Backtesting' : activeTab === 'RSI_MAP' ? 'RSI-Karte' : 'Marktübersicht'}
            </h1>

            {activeTab === 'DASHBOARD' && (
              <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/[0.04] w-fit">
                <button
                  onClick={() => setDashboardView('STATS')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dashboardView === 'STATS' ? 'bg-cyan-500/20 text-cyan-500' : `text-slate-500 ${theme === 'dark' ? 'hover:text-white hover:bg-white/[0.04]' : 'hover:text-black hover:bg-black/[0.04]'}`}`}
                >
                  <LayoutGrid size={14} className="inline mr-2" />
                  Insights
                </button>
                <button
                  onClick={() => setDashboardView('PRICES')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex gap-2 items-center ${dashboardView === 'PRICES' ? 'bg-cyan-500/20 text-cyan-500' : `text-slate-500 ${theme === 'dark' ? 'hover:text-white hover:bg-white/[0.04]' : 'hover:text-black hover:bg-black/[0.04]'}`}`}
                >
                  <List size={14} />
                  Kurse
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/20">LIVE</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'DASHBOARD' && (
              <div className={`flex items-center gap-1 p-1 rounded-xl transition-all ${theme === 'dark' ? 'bg-white/[0.03] border-white/[0.04]' : 'bg-black/[0.03] border-black/[0.04]'} border`}>
                <button onClick={fetchBinanceData} className={`p-2.5 rounded-lg transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-cyan-400 hover:bg-white/[0.04]' : 'text-slate-500 hover:text-cyan-600 hover:bg-black/[0.04]'}`}>
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                </button>
                <div className={`w-px h-5 ${theme === 'dark' ? 'bg-white/[0.06]' : 'bg-black/[0.1]'}`}></div>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as Timeframe)}
                  className="bg-transparent text-sm font-medium focus:outline-none px-3 py-2 cursor-pointer"
                >
                  <option value="15m" className="bg-slate-900">15m</option>
                  <option value="4h" className="bg-slate-900">4h</option>
                  <option value="1d" className="bg-slate-900">1D</option>
                </select>
              </div>
            )}

            {activeTab === 'RULES' && (
              <>
                <button
                  onClick={requestNotificationPermission}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${notificationPermission === 'granted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06] hover:text-white'}`}
                >
                  <BellRing size={16} /> {notificationPermission === 'granted' ? 'Aktiv' : 'Aktivieren'}
                </button>
                <button onClick={() => setIsCreatingRule(true)} className="btn-primary py-2.5 px-4 rounded-xl flex gap-2 items-center text-sm font-semibold">
                  <Plus size={18} /> Regel erstellen
                </button>
              </>
            )}

            <div className={`w-px h-8 mx-2 ${theme === 'dark' ? 'bg-white/[0.06]' : 'bg-black/[0.1]'}`}></div>

            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all border ${theme === 'dark' ? 'bg-white/[0.03] border-white/[0.06] text-amber-400 hover:bg-white/[0.1] hover:text-amber-300' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
              title={theme === 'dark' ? 'Heller Modus' : 'Dunkler Modus'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar pb-24 md:pb-0">

          <div className="max-w-7xl mx-auto pb-20 animate-slide-up">
            {activeTab === 'DASHBOARD' && (
              <>
                {dashboardView === 'STATS' && (
                  <div className="space-y-6">
                    {/* Floating Filter Pill */}
                    <div className="flex justify-center mb-8">
                      <div className="flex bg-black/20 backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-xl">
                        <button
                          onClick={() => setMarketFilter('CRYPTO')}
                          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${marketFilter === 'CRYPTO' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
                        >
                          Krypto
                        </button>
                        <button
                          onClick={() => setMarketFilter('STOCK')}
                          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${marketFilter === 'STOCK' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
                        >
                          Aktien
                        </button>
                        <button
                          onClick={() => setMarketFilter('COMMODITY')}
                          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${marketFilter === 'COMMODITY' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
                        >
                          Rohstoffe
                        </button>
                      </div>
                    </div>

                    {/* Bento Grid Layout - REFACTORED */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min">
                      {/* Fear & Greed - Large Square */}
                      <div className="lg:col-span-2 lg:row-span-2 h-full">
                        <div className="h-full glass-panel rounded-3xl p-1">
                          <FearGreedIndex />
                        </div>
                      </div>

                      {/* Sentiment Indicator - Wide Rect */}
                      <div className="lg:col-span-2 h-full">
                        <div className="h-full glass-panel rounded-3xl p-6 glass-panel-hover">
                          <SentimentIndicator type={marketFilter === 'COMMODITY' ? 'CRYPTO' : marketFilter as any} />
                        </div>
                      </div>

                      {/* Whale Feed - Tall Rect or remaining space */}
                      <div className="lg:col-span-2 h-full">
                        <div className="h-full glass-panel rounded-3xl p-6 glass-panel-hover overflow-hidden">
                          {(marketFilter === 'CRYPTO' || marketFilter === 'COMMODITY') && <WhaleFeed type={marketFilter === 'COMMODITY' ? 'CRYPTO' : marketFilter} />}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dashboardView === 'PRICES' && (
                  <div className="space-y-8">
                    <section>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg shadow-orange-500/20">
                            <Layers size={18} className="text-white" />
                          </div>
                          {marketFilter === 'CRYPTO' ? 'Top Krypto Assets' : marketFilter === 'STOCK' ? 'Top Aktien' : 'Rohstoffe'}
                        </h2>
                        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                          <button
                            onClick={() => setMarketFilter('CRYPTO')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${marketFilter === 'CRYPTO' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                          >
                            Krypto
                          </button>
                          <button
                            onClick={() => setMarketFilter('STOCK')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${marketFilter === 'STOCK' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                          >
                            Aktien
                          </button>
                        </div>
                      </div>
                      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
                        <AssetTable assets={assets.filter(a => a.type === marketFilter)} timeframe={selectedTimeframe} />
                      </div>
                    </section>
                  </div>
                )}
              </>
            )}

            {activeTab === 'RULES' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Clock size={16} className="text-primary" /> Aktive Regeln</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeRules.map(r => (
                      <div key={r.id} className={`glass-panel rounded-2xl p-6 relative group hover:-translate-y-1 transition-all duration-300 ${r.active ? 'animate-pulse-glow' : ''}`}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div>
                            <span className="font-bold text-lg text-white block">{getAssetLabel(r.assetId)}</span>
                            <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">{r.timeframe}</span>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${r.active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse-dot' : 'bg-slate-700'}`}></div>
                        </div>

                        <div className="text-sm text-slate-300 mb-6 space-y-2 relative z-10 min-h-[60px]">
                          {r.conditions?.map((c, i) => (
                            <div key={i} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/5">
                              <span className="font-mono text-primary font-bold">{c.indicator}</span>
                              <span className="text-xs">{c.operator === 'LESS_THAN' ? 'fällt unter' : 'steigt über'}</span>
                              <span className="font-bold text-white">{c.threshold}</span>
                            </div>
                          )) ?? (
                              <div className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="font-mono text-primary font-bold">{r.indicator}</span>
                                <span className="text-xs">{r.operator}</span>
                                <span className="font-bold text-white">{r.threshold}</span>
                              </div>
                            )}
                        </div>

                        <div className="flex gap-2 relative z-10 pt-4 border-t border-white/5">
                          <button onClick={() => handleToggleRule(r.id)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400"><BellOff size={16} className="mx-auto" /></button>
                          <button onClick={() => { setEditingRule(r); setIsCreatingRule(true); }} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors text-slate-400"><Edit3 size={16} className="mx-auto" /></button>
                          <button onClick={() => handleDeleteRule(r.id)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-colors text-slate-400"><Trash2 size={16} className="mx-auto" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <div className="glass-panel rounded-3xl p-6">
                  <SignalFeed
                    signals={signals}
                    onDeleteSignal={(id) => setSignals(prev => prev.filter(s => s.id !== id))}
                    onClearAllSignals={() => setSignals([])}
                  />
                </div>

                {triggeredRules.length > 0 && <section>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500" /> Historie</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {triggeredRules.map(r => (
                      <div key={r.id} className="glass-panel p-4 rounded-xl opacity-60 hover:opacity-100 transition-all border-l-4 border-l-emerald-500">
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-white">{getAssetLabel(r.assetId)}</span>
                          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Ausgelöst</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleResetTriggered(r.id)} className="flex-1 py-2 text-xs bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors font-medium">Reaktivieren</button>
                          <button onClick={() => handleDeleteRule(r.id)} className="flex-1 py-2 text-xs bg-rose-500/10 text-rose-400 rounded hover:bg-rose-500/20 transition-colors font-medium">Löschen</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>}
              </div>
            )}

            {activeTab === 'PORTFOLIO' && <PortfolioTracker assets={assets} />}
            {activeTab === 'STRATEGIES' && <StrategyGuide />}
            {activeTab === 'BACKTEST' && <BacktestPanel />}
            {activeTab === 'RSI_MAP' && <RSIHeatmap />}
          </div>
        </div>
      </main>

      {(isCreatingRule || editingRule) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <RuleBuilder
            assets={assets}
            onAddRule={(r) => { setRules([...rules, r]); setIsCreatingRule(false); }}
            onUpdateRule={(r) => { setRules(rules.map(rule => rule.id === r.id ? r : rule)); setEditingRule(null); }}
            onCancel={() => { setIsCreatingRule(false); setEditingRule(null); }}
            editRule={editingRule}
          />
        </div>
      )}

      {/* Donation Modal */}
      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </div>
  );
};
export default App;
