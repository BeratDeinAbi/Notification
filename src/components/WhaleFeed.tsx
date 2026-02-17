import React, { useState, useEffect } from 'react';
import { Anchor, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface WhaleTx {
    id: string;
    coin: string;
    amount: number;
    value: number;
    type: 'BUY' | 'SELL';
    time: Date;
}

interface WhaleFeedProps {
    type?: 'CRYPTO' | 'STOCK';
}

const WhaleFeed: React.FC<WhaleFeedProps> = ({ type = 'CRYPTO' }) => {
    const [txs, setTxs] = useState<WhaleTx[]>([]);

    useEffect(() => {
        setTxs([]);

        const interval = setInterval(() => {
            const assets = type === 'CRYPTO'
                ? ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE']
                : ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL'];

            const types: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
            const coin = assets[Math.floor(Math.random() * assets.length)];
            const txType = types[Math.floor(Math.random() * types.length)];

            let amount = 0;
            let price = 0;

            if (type === 'CRYPTO') {
                amount = coin === 'BTC' ? (Math.random() * 500 + 100) :
                    coin === 'ETH' ? (Math.random() * 5000 + 1000) :
                        (Math.random() * 1000000 + 100000);

                price = coin === 'BTC' ? 45000 : coin === 'ETH' ? 2500 : coin === 'SOL' ? 100 : 0.5;
            } else {
                amount = Math.random() * 2000;
                price = coin === 'AAPL' ? 180 : coin === 'TSLA' ? 200 : coin === 'NVDA' ? 500 : 150;
            }

            const value = amount * price;

            if (value > 10000000) {
                const newTx: WhaleTx = {
                    id: Date.now().toString(),
                    coin,
                    amount: parseFloat(amount.toFixed(0)),
                    value: parseFloat(value.toFixed(0)),
                    type: txType,
                    time: new Date()
                };
                setTxs(prev => [newTx, ...prev].slice(0, 5));
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [type]);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 overflow-hidden relative">
            <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                <Anchor size={18} className="text-indigo-500" />
                <span>Whale Radar ({type === 'CRYPTO' ? 'Krypto' : 'Aktien'})</span>
                <span className="animate-pulse w-2 h-2 rounded-full bg-indigo-500"></span>
            </h3>

            <div className="space-y-3">
                {txs.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-colors animate-slide-up">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${tx.type === 'BUY' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                {tx.type === 'BUY'
                                    ? <ArrowUpRight size={16} className="text-emerald-500" />
                                    : <ArrowDownRight size={16} className="text-rose-500" />
                                }
                            </div>
                            <div>
                                <div className="font-bold text-sm text-gray-900">{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {tx.coin}</div>
                                <div className="text-xs text-gray-400">{tx.type === 'BUY' ? 'Gekauft' : 'Verkauft'}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-sm text-indigo-600 font-bold">${(tx.value / 1000000).toFixed(1)}M</div>
                            <div className="text-[10px] text-gray-400">{tx.time.toLocaleTimeString()}</div>
                        </div>
                    </div>
                ))}
                {txs.length === 0 && <div className="text-center text-gray-400 text-sm py-4 italic">Scanne Netzwerk...</div>}
            </div>
        </div>
    );
};

export default WhaleFeed;
