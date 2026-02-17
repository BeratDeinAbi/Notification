import React, { useState } from 'react';
import { BookOpen, TrendingUp, Activity, BarChart2, AlertTriangle, Zap, ArrowRight, Check, X } from 'lucide-react';

interface Strategy {
    id: string;
    title: string;
    icon: React.ReactNode;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    description: string;
    buySignal: string;
    sellSignal: string;
    proTip: string;
    color: string;
}

const STRATEGIES: Strategy[] = [
    {
        id: 'rsi-divergence',
        title: 'RSI Divergenz',
        icon: <Activity size={24} />,
        difficulty: 'MEDIUM',
        color: 'text-purple-600',
        description: 'Eine Divergenz tritt auf, wenn der Preis ein neues Hoch/Tief erreicht, der RSI aber nicht. Dies deutet auf eine nachlassende Trendstärke hin.',
        buySignal: 'Preis fällt auf tieferes Tief, aber RSI macht ein höheres Tief (Bullish Divergence).',
        sellSignal: 'Preis steigt auf höheres Hoch, aber RSI macht ein tieferes Hoch (Bearish Divergence).',
        proTip: 'Warte auf eine Bestätigung durch eine grüne Kerze nach der Divergenz, bevor du einsteigst.'
    },
    {
        id: 'macd-cross',
        title: 'MACD Golden Cross',
        icon: <TrendingUp size={24} />,
        difficulty: 'EASY',
        color: 'text-emerald-600',
        description: 'Der MACD (Moving Average Convergence Divergence) zeigt Trendwechsel an. Ein "Cross" ist eines der zuverlässigsten Signale in Trendmärkten.',
        buySignal: 'Die schnelle MACD-Linie kreuzt die Signallinie von unten nach oben (Golden Cross).',
        sellSignal: 'Die schnelle MACD-Linie kreuzt die Signallinie von oben nach unten (Death Cross).',
        proTip: 'Signale unterhalb der Nulllinie sind oft stärker für Käufe (Überverkauft).'
    },
    {
        id: 'bollinger-squeeze',
        title: 'Bollinger Bands Squeeze',
        icon: <BarChart2 size={24} />,
        difficulty: 'HARD',
        color: 'text-blue-600',
        description: 'Wenn sich die Bollinger Bänder extrem zusammenziehen (Squeeze), deutet dies auf eine bevorstehende explosive Bewegung hin.',
        buySignal: 'Bänder öffnen sich und Preis bricht durch das obere Band aus.',
        sellSignal: 'Bänder öffnen sich und Preis bricht durch das untere Band ein.',
        proTip: 'Kombiniere dies mit dem Volumen. Ein Ausbruch ohne Volumen ist oft ein Fake-Out.'
    },
    {
        id: 'fear-greed',
        title: 'Fear & Greed Contrarian',
        icon: <Zap size={24} />,
        difficulty: 'EASY',
        color: 'text-amber-600',
        description: '"Sei gierig, wenn andere ängstlich sind". Extreme Marktstimmung ist oft ein Kontra-Indikator.',
        buySignal: 'Extreme Fear (< 20). Panikverkäufe sind oft der Boden.',
        sellSignal: 'Extreme Greed (> 80). FOMO treibt den Preis oft zu hoch.',
        proTip: 'Kaufe nie alles auf einmal (DCA), wenn der Markt in "Extreme Fear" fällt.'
    }
];

const StrategyGuide: React.FC = () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-400"></div>

                <BookOpen size={48} className="mx-auto text-gray-900 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Master Class Trading Strategien</h2>
                <p className="text-gray-500 max-w-lg mx-auto">
                    Hier lernst du die effektivsten Methoden, um Märkte zu analysieren.
                    Diese Strategien werden von Profis weltweit genutzt.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {STRATEGIES.map(strategy => (
                    <div
                        key={strategy.id}
                        className={`
                            bg-white border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group shadow-sm
                            ${selectedId === strategy.id ? 'border-gray-900 shadow-md ring-1 ring-gray-900' : 'border-gray-100 hover:border-gray-300'}
                        `}
                        onClick={() => setSelectedId(selectedId === strategy.id ? null : strategy.id)}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl bg-gray-50 ${strategy.color}`}>
                                        {strategy.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{strategy.title}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${strategy.difficulty === 'EASY' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' :
                                            strategy.difficulty === 'MEDIUM' ? 'border-amber-200 text-amber-600 bg-amber-50' :
                                                'border-rose-200 text-rose-600 bg-rose-50'
                                            }`}>
                                            {strategy.difficulty}
                                        </span>
                                    </div>
                                </div>
                                <ArrowRight className={`text-gray-400 transition-transform duration-300 ${selectedId === strategy.id ? 'rotate-90 text-gray-900' : 'group-hover:translate-x-1'}`} />
                            </div>

                            <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                {strategy.description}
                            </p>

                            {selectedId === strategy.id && (
                                <div className="mt-6 space-y-4 animate-slide-down border-t border-gray-100 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs mb-1 uppercase">
                                                <Check size={14} /> Buy Signal
                                            </div>
                                            <p className="text-gray-600 text-xs">{strategy.buySignal}</p>
                                        </div>
                                        <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                                            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs mb-1 uppercase">
                                                <X size={14} /> Sell Signal
                                            </div>
                                            <p className="text-gray-600 text-xs">{strategy.sellSignal}</p>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3">
                                        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-amber-600 font-bold text-xs uppercase block mb-0.5">Profi Tipp</span>
                                            <p className="text-gray-600 text-sm italic">{strategy.proTip}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StrategyGuide;
