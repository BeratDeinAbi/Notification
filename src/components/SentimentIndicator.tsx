import React, { useState, useEffect } from 'react';
import { Twitter, MessageCircle } from 'lucide-react';

interface SentimentIndicatorProps {
    type?: 'CRYPTO' | 'STOCK';
}

const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({ type = 'CRYPTO' }) => {
    const [sentiment, setSentiment] = useState(50);
    const [volume, setVolume] = useState(1243);

    useEffect(() => {
        setSentiment(type === 'CRYPTO' ? 45 : 60);
        setVolume(type === 'CRYPTO' ? 5000 : 1200);

        const interval = setInterval(() => {
            setSentiment(prev => Math.max(10, Math.min(90, prev + (Math.random() - 0.5) * 10)));
            setVolume(prev => prev + Math.floor(Math.random() * 5));
        }, 5000);
        return () => clearInterval(interval);
    }, [type]);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-gray-900 font-bold mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <MessageCircle size={18} className="text-sky-500" />
                    Social Sentiment ({type === 'CRYPTO' ? 'Crypto' : 'Aktien'})
                </span>
                <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-sky-100">
                    <Twitter size={10} /> Live
                </span>
            </h3>

            <div className="mb-4">
                <div className="flex justify-between text-xs mb-2">
                    <span className="text-rose-500 font-bold">Bearish</span>
                    <span className="text-emerald-500 font-bold">Bullish</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                        className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-400 via-gray-300 to-emerald-400 transition-all duration-1000 ease-out"
                        style={{ width: '100%', opacity: 0.4 }}
                    ></div>
                    <div
                        className="absolute top-0 bottom-0 w-2 bg-gray-800 shadow-[0_0_6px_rgba(0,0,0,0.3)] transition-all duration-1000 ease-out z-10 rounded-full"
                        style={{ left: `${sentiment}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="text-xs text-gray-400 mb-1">Sentiment Score</div>
                    <div className={`text-xl font-bold font-mono ${sentiment > 55 ? 'text-emerald-500' : sentiment < 45 ? 'text-rose-500' : 'text-yellow-500'}`}>
                        {sentiment.toFixed(0)}/100
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="text-xs text-gray-400 mb-1">Posts / Stunde</div>
                    <div className="text-xl font-bold text-gray-900 font-mono">{volume}</div>
                </div>
            </div>
        </div>
    );
};

export default SentimentIndicator;
