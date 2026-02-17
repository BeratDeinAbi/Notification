import React from 'react';
import { X, Heart, Copy, CheckCircle } from 'lucide-react';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
    const [copied, setCopied] = React.useState<string | null>(null);

    if (!isOpen) return null;

    const handleCopy = (address: string, type: string) => {
        navigator.clipboard.writeText(address);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md relative overflow-hidden shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="p-6 pb-0 flex justify-between items-start">
                    <div>
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/30 mb-4">
                            <Heart size={24} fill="currentColor" className="animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Projekt unterstützen</h2>
                        <p className="text-gray-500 mt-1 text-sm">Hilf uns, dieses Tool werbefrei und kostenlos zu halten.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Contents */}
                <div className="p-6 space-y-6">

                    {/* PayPal */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">PayPal</label>
                        <button className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 group">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 0.867 4.498-1.3 6.209-4.243 8.134-8.716 8.134H9.083c-.001 0-.001-.001-.002 0l-1.6 7.606a.7.7 0 0 1-.405.61z" />
                            </svg>
                            <span>Spenden mit PayPal</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-auto group-hover:bg-white/30 transition-colors">Einfach & Sicher</span>
                        </button>
                    </div>

                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <span className="relative z-10 bg-white px-4 text-xs font-medium text-gray-400 uppercase">Oder Krypto</span>
                    </div>

                    {/* Crypto Options */}
                    <div className="space-y-4">
                        {/* Bitcoin */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 transition-colors hover:border-gray-200 group">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#F7931A] flex items-center justify-center shadow-sm">
                                        <span className="font-bold text-white text-[10px]">₿</span>
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">Bitcoin (BTC)</span>
                                </div>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">BTC Network</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100">
                                <code className="text-[10px] text-gray-500 truncate flex-1 font-mono">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>
                                <button
                                    onClick={() => handleCopy('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'btc')}
                                    className="p-1.5 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    {copied === 'btc' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Ethereum */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 transition-colors hover:border-gray-200 group">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#627EEA] flex items-center justify-center shadow-sm">
                                        <span className="font-bold text-white text-[10px]">Ξ</span>
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">Ethereum (ETH)</span>
                                </div>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">ERC-20</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100">
                                <code className="text-[10px] text-gray-500 truncate flex-1 font-mono">0x71C7656EC7ab88b098defB751B7401B5f6d8976F</code>
                                <button
                                    onClick={() => handleCopy('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'eth')}
                                    className="p-1.5 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    {copied === 'eth' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-400">Danke für deinen Support! ❤️</p>
                </div>
            </div>
        </div>
    );
};

export default DonationModal;
