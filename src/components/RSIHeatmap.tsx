import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, TrendingUp, TrendingDown, Bitcoin, BarChart3 } from 'lucide-react';

interface RSICoin {
    symbol: string;
    name: string;
    rsi: number;
    price: number;
    change24h: number;
}

type HeatmapTimeframe = '15m' | '1h' | '4h' | '1d' | '1w';
type MarketType = 'CRYPTO' | 'STOCK';

const RSI_ZONES = [
    { min: 70, max: 100, label: 'Überkauft', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.12)' },
    { min: 60, max: 70, label: 'Stark', color: '#fb923c', bgColor: 'rgba(251, 146, 60, 0.08)' },
    { min: 40, max: 60, label: 'Neutral', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.05)' },
    { min: 30, max: 40, label: 'Schwach', color: '#22d3ee', bgColor: 'rgba(34, 211, 238, 0.08)' },
    { min: 0, max: 30, label: 'Überverkauft', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.12)' },
];

const TIMEFRAME_OPTIONS: { value: HeatmapTimeframe; label: string }[] = [
    { value: '15m', label: '15 Min' },
    { value: '1h', label: '1 Stunde' },
    { value: '4h', label: '4 Stunden' },
    { value: '1d', label: '1 Tag' },
    { value: '1w', label: '1 Woche' },
];

const TWELVE_DATA_API_KEY = '7ec0909c64a74e1baef4ba143b67ec35';

// Popular US stocks for RSI heatmap
const STOCK_LIST = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT',
    'JNJ', 'PG', 'MA', 'UNH', 'HD', 'DIS', 'BAC', 'ADBE', 'CRM', 'NFLX',
    'PFE', 'CSCO', 'INTC', 'VZ', 'KO', 'PEP', 'MRK', 'ABT', 'T', 'XOM'
];

// Calculate RSI from price data
const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) return 50;

    let gains = 0, losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change >= 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss);
    return 100 - (100 / (1 + rs));
};

const getZoneForRSI = (rsi: number) => {
    return RSI_ZONES.find(zone => rsi >= zone.min && rsi < zone.max) || RSI_ZONES[2];
};

const RSIHeatmap: React.FC = () => {
    const [coins, setCoins] = useState<RSICoin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<HeatmapTimeframe>('4h');
    const [marketType, setMarketType] = useState<MarketType>('CRYPTO');
    const [hoveredCoin, setHoveredCoin] = useState<RSICoin | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchStockData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Sequential fetching with delays to respect rate limit (8 req/min)
            // Only fetch first 8 stocks to stay within rate limit for one minute
            const stocksToFetch = STOCK_LIST.slice(0, 8);
            const results: RSICoin[] = [];

            for (let i = 0; i < stocksToFetch.length; i++) {
                const symbol = stocksToFetch[i];
                try {
                    const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=50&apikey=${TWELVE_DATA_API_KEY}`);
                    const data = await res.json();

                    if (data.status === 'error' || !data.values) {
                        console.warn(`Twelve Data error for ${symbol}:`, data.message);
                        continue;
                    }

                    const closes = data.values.map((v: any) => parseFloat(v.close)).reverse();
                    const rsi = calculateRSI(closes);
                    const latestClose = parseFloat(data.values[0].close);
                    const prevClose = parseFloat(data.values[1]?.close || data.values[0].close);
                    const change = ((latestClose - prevClose) / prevClose) * 100;

                    results.push({
                        symbol,
                        name: symbol,
                        rsi,
                        price: latestClose,
                        change24h: change
                    });

                    // Update state progressively so user sees data appearing
                    setCoins([...results]);

                    // Delay between requests (8 req/min = ~7.5s between requests)
                    if (i < stocksToFetch.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 8000));
                    }
                } catch (err) {
                    console.error(`Error fetching ${symbol}:`, err);
                }
            }

            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching stock data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTop100Cryptos = useCallback(async () => {
        setIsLoading(true);
        try {
            // Get top 100 symbols by volume from Binance
            const tickerRes = await fetch('https://api.binance.com/api/v3/ticker/24hr');
            const tickerData = await tickerRes.json();

            // Filter USDT pairs and sort by volume
            const usdtPairs = tickerData
                .filter((t: any) => t.symbol.endsWith('USDT') && !t.symbol.includes('UP') && !t.symbol.includes('DOWN'))
                .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, 100);

            // Map timeframe to Binance interval
            const intervalMap: Record<HeatmapTimeframe, string> = {
                '15m': '15m',
                '1h': '1h',
                '4h': '4h',
                '1d': '1d',
                '1w': '1w',
            };

            // Fetch klines for each coin (batch in groups to avoid rate limits)
            const batchSize = 10;
            const allCoins: RSICoin[] = [];

            for (let i = 0; i < usdtPairs.length; i += batchSize) {
                const batch = usdtPairs.slice(i, i + batchSize);
                const batchPromises = batch.map(async (ticker: any) => {
                    try {
                        const klineRes = await fetch(
                            `https://api.binance.com/api/v3/klines?symbol=${ticker.symbol}&interval=${intervalMap[timeframe]}&limit=50`
                        );
                        const klineData = await klineRes.json();

                        if (!Array.isArray(klineData)) return null;

                        const closes = klineData.map((c: any) => parseFloat(c[4]));
                        const rsi = calculateRSI(closes);

                        return {
                            symbol: ticker.symbol.replace('USDT', ''),
                            name: ticker.symbol.replace('USDT', ''),
                            rsi: rsi,
                            price: parseFloat(ticker.lastPrice),
                            change24h: parseFloat(ticker.priceChangePercent),
                        } as RSICoin;
                    } catch {
                        return null;
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                allCoins.push(...batchResults.filter((c): c is RSICoin => c !== null));

                // Small delay between batches to avoid rate limits
                if (i + batchSize < usdtPairs.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            setCoins(allCoins);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching crypto data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [timeframe]);

    useEffect(() => {
        if (marketType === 'CRYPTO') {
            fetchTop100Cryptos();
        } else {
            fetchStockData();
        }
    }, [marketType, fetchTop100Cryptos, fetchStockData]);

    const handleRefresh = () => {
        if (marketType === 'CRYPTO') {
            fetchTop100Cryptos();
        } else {
            fetchStockData();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    // Calculate average RSI
    const avgRSI = coins.length > 0
        ? coins.reduce((sum, c) => sum + c.rsi, 0) / coins.length
        : 50;

    // Count coins per zone
    const zoneCounts = RSI_ZONES.map(zone => ({
        ...zone,
        count: coins.filter(c => c.rsi >= zone.min && c.rsi < zone.max).length,
    }));

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Market Type Toggle */}
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
                        <button
                            onClick={() => setMarketType('CRYPTO')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${marketType === 'CRYPTO' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Bitcoin size={16} /> Krypto
                        </button>
                        <button
                            onClick={() => setMarketType('STOCK')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${marketType === 'STOCK' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <BarChart3 size={16} /> Aktien
                        </button>
                    </div>

                    {/* Timeframe Selector - only show for crypto */}
                    {marketType === 'CRYPTO' && (
                        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
                            {TIMEFRAME_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTimeframe(opt.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeframe === opt.value
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Last Update */}
                    {lastUpdate && (
                        <span className="text-xs text-slate-500">
                            Aktualisiert: {lastUpdate.toLocaleTimeString('de-DE')}
                        </span>
                    )}

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-slate-300 hover:text-white disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <RefreshCw size={18} />
                        )}
                        Aktualisieren
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="glass-panel rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{coins.length}</div>
                    <div className="text-xs text-slate-400 mt-1">Coins geladen</div>
                </div>
                <div className="glass-panel rounded-2xl p-4 text-center">
                    <div className={`text-2xl font-bold ${avgRSI > 60 ? 'text-red-400' : avgRSI < 40 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {avgRSI.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Durchschn. RSI</div>
                </div>
                {zoneCounts.slice(0, 4).map(zone => (
                    <div key={zone.label} className="glass-panel rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold" style={{ color: zone.color }}>{zone.count}</div>
                        <div className="text-xs text-slate-400 mt-1">{zone.label}</div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                {RSI_ZONES.map(zone => (
                    <div key={zone.label} className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: zone.color }}
                        />
                        <span className="text-xs text-slate-400">{zone.label}</span>
                    </div>
                ))}
            </div>

            {/* Heatmap Container */}
            <div
                className="glass-panel rounded-3xl p-6 relative overflow-hidden"
                onMouseMove={handleMouseMove}
                style={{ minHeight: '500px' }}
            >
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                            <p className="text-slate-400">Lade Top 100 Kryptos...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* RSI Zone Backgrounds */}
                        <div className="absolute inset-0 pointer-events-none">
                            {RSI_ZONES.map((zone, idx) => {
                                const topPercent = ((100 - zone.max) / 100) * 100;
                                const heightPercent = ((zone.max - zone.min) / 100) * 100;
                                return (
                                    <div
                                        key={zone.label}
                                        className="absolute left-0 right-0"
                                        style={{
                                            top: `${topPercent}%`,
                                            height: `${heightPercent}%`,
                                            backgroundColor: zone.bgColor,
                                            borderTop: idx === 0 ? 'none' : `1px dashed ${zone.color}40`,
                                        }}
                                    >
                                        <span
                                            className="absolute right-4 top-2 text-xs font-medium opacity-60"
                                            style={{ color: zone.color }}
                                        >
                                            {zone.label} ({zone.min}-{zone.max})
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Y-Axis Labels */}
                        <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-4 pointer-events-none">
                            {[100, 80, 60, 40, 20, 0].map(val => (
                                <span key={val} className="text-xs text-slate-500 font-mono">{val}</span>
                            ))}
                        </div>

                        {/* Coin Dots */}
                        <div className="relative ml-8" style={{ height: '450px' }}>
                            {coins.map((coin, idx) => {
                                const zone = getZoneForRSI(coin.rsi);
                                const yPos = ((100 - coin.rsi) / 100) * 100;
                                // Use deterministic positioning based on index and symbol hash
                                const hash = coin.symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                                const col = idx % 10;
                                const xPos = (col / 10) * 85 + ((hash % 50) / 50) * 8 + 5;

                                return (
                                    <div
                                        key={coin.symbol}
                                        className="absolute cursor-pointer group"
                                        style={{
                                            left: `${xPos}%`,
                                            top: `${yPos}%`,
                                            transform: 'translate(-50%, -50%)',
                                            zIndex: hoveredCoin?.symbol === coin.symbol ? 50 : 1,
                                        }}
                                        onMouseEnter={() => setHoveredCoin(coin)}
                                        onMouseLeave={() => setHoveredCoin(null)}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg transition-transform duration-200 group-hover:scale-150"
                                            style={{
                                                backgroundColor: zone.color,
                                                boxShadow: `0 0 10px ${zone.color}60`,
                                            }}
                                        >
                                            {coin.symbol.slice(0, 4)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Average RSI Line */}
                        <div
                            className="absolute left-8 right-4 border-t-2 border-dashed border-primary/50 pointer-events-none"
                            style={{ top: `${((100 - avgRSI) / 100) * 100}%` }}
                        >
                            <span className="absolute right-0 -top-5 text-xs text-primary font-bold bg-slate-900/80 px-2 py-1 rounded">
                                Durchschnitt RSI: {avgRSI.toFixed(2)}
                            </span>
                        </div>
                    </>
                )}

                {/* Tooltip */}
                {hoveredCoin && (
                    <div
                        className="fixed z-[100] pointer-events-none"
                        style={{
                            left: mousePos.x + 15,
                            top: mousePos.y + 15,
                        }}
                    >
                        <div className="glass-panel rounded-xl p-4 shadow-2xl border border-white/20 min-w-[200px]">
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                    style={{ backgroundColor: getZoneForRSI(hoveredCoin.rsi).color }}
                                >
                                    {hoveredCoin.symbol.slice(0, 3)}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{hoveredCoin.symbol}</div>
                                    <div className="text-xs text-slate-400">{getZoneForRSI(hoveredCoin.rsi).label}</div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">RSI</span>
                                    <span
                                        className="font-bold"
                                        style={{ color: getZoneForRSI(hoveredCoin.rsi).color }}
                                    >
                                        {hoveredCoin.rsi.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Preis</span>
                                    <span className="text-white font-mono">
                                        ${hoveredCoin.price < 1 ? hoveredCoin.price.toFixed(6) : hoveredCoin.price.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">24h</span>
                                    <span className={`flex items-center gap-1 ${hoveredCoin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {hoveredCoin.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {hoveredCoin.change24h.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RSIHeatmap;
