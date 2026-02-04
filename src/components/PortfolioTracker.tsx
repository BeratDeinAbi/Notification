import React, { useState, useEffect, useMemo } from 'react';
import type { Asset, PortfolioItem } from '../types';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, LineChart, Edit3, Trash2, CheckCircle, History, ArrowRight } from 'lucide-react';

interface PortfolioTrackerProps { assets: Asset[]; }
const CHART_COLORS = ['#a3e635', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4', '#ec4899'];

type ModalMode = 'CREATE' | 'EDIT' | 'SELL';

const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({ assets }) => {
  const [items, setItems] = useState<PortfolioItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('sentinel_portfolio') || '[]'); } catch { return []; }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('CREATE');
  const [chartView, setChartView] = useState<'ALLOCATION' | 'HISTORY'>('ALLOCATION');

  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const [formData, setFormData] = useState<Partial<PortfolioItem>>({
    assetSymbol: 'BTC', amount: 0, buyPrice: 0, buyDate: new Date().toISOString().split('T')[0], isSold: false, sellPrice: 0, sellDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => localStorage.setItem('sentinel_portfolio', JSON.stringify(items)), [items]);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setSelectedItem(null);
    setFormData({ assetSymbol: 'BTC', amount: 0, buyPrice: 0, buyDate: new Date().toISOString().split('T')[0], isSold: false });
    setIsModalOpen(true);
  };

  const openEditModal = (item: PortfolioItem) => {
    setModalMode('EDIT');
    setSelectedItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const openSellModal = (item: PortfolioItem) => {
    const asset = assets.find(a => a.symbol === item.assetSymbol);
    setModalMode('SELL');
    setSelectedItem(item);
    setFormData({
      ...item,
      sellPrice: asset ? asset.price : item.buyPrice, // Suggest current price
      sellDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (modalMode === 'CREATE') {
      const newItem: PortfolioItem = {
        id: Date.now().toString(),
        assetSymbol: formData.assetSymbol!.toUpperCase(),
        amount: Number(formData.amount),
        buyPrice: Number(formData.buyPrice),
        buyDate: formData.buyDate!,
        isSold: false
      };
      setItems([newItem, ...items]);
    } else if (modalMode === 'EDIT' && selectedItem) {
      const updatedItems = items.map(i => i.id === selectedItem.id ? { ...i, ...formData, id: i.id } as PortfolioItem : i); // Keep ID
      setItems(updatedItems);
    } else if (modalMode === 'SELL' && selectedItem) {
      const updatedItems = items.map(i => i.id === selectedItem.id ? {
        ...i,
        isSold: true,
        sellPrice: Number(formData.sellPrice),
        sellDate: formData.sellDate
      } : i);
      setItems(updatedItems);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const holdings = items.filter(i => !i.isSold);
  const soldItems = items.filter(i => i.isSold);

  const totalInvested = holdings.reduce((sum, item) => sum + (item.amount * item.buyPrice), 0);

  let totalCurrentValue = 0;
  let realizedPnL = 0;
  let unrealizedPnL = 0;

  holdings.forEach(item => {
    const asset = assets.find(a => a.symbol === item.assetSymbol);
    const currentPrice = asset ? asset.price : item.buyPrice;
    const currentValue = currentPrice * item.amount;
    const costBasis = item.buyPrice * item.amount;
    totalCurrentValue += currentValue;
    unrealizedPnL += currentValue - costBasis;
  });

  soldItems.forEach(item => {
    if (item.sellPrice && item.sellDate) {
      realizedPnL += (item.sellPrice - item.buyPrice) * item.amount;
    }
  });

  const totalPnL = unrealizedPnL + realizedPnL;

  const allocation = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    holdings.forEach(item => {
      const asset = assets.find(a => a.symbol === item.assetSymbol);
      const value = (asset ? asset.price : item.buyPrice) * item.amount;
      grouped[item.assetSymbol] = (grouped[item.assetSymbol] || 0) + value;
    });
    return Object.entries(grouped).map(([symbol, value], i) => ({
      symbol, value, percentage: totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0, color: CHART_COLORS[i % CHART_COLORS.length]
    }));
  }, [holdings, assets, totalCurrentValue]);

  // --- Sub-Components ---
  const DonutChart = () => {
    if (allocation.length === 0) return <div className="flex items-center justify-center h-full text-zinc-600 text-sm">Füge Assets hinzu.</div>;
    const size = 160; const strokeWidth = 24; const radius = (size - strokeWidth) / 2; const circumference = 2 * Math.PI * radius; let offset = 0;
    return (
      <div className="flex flex-col items-center gap-4">
        <svg width={size} height={size} className="transform -rotate-90">
          {allocation.map((item) => {
            const da = (item.percentage / 100) * circumference; const doff = -offset; offset += da;
            return <circle key={item.symbol} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={item.color} strokeWidth={strokeWidth} strokeDasharray={`${da} ${circumference}`} strokeDashoffset={doff} className="transition-all duration-500" />;
          })}
        </svg>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {allocation.map((item) => (
            <div key={item.symbol} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-zinc-400">{item.symbol}</span>
              <span className="text-zinc-500 font-mono">{item.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-subtle p-5 rounded-xl">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Gesamt Investiert</span>
          <div className="text-2xl font-mono text-zinc-100 mt-2">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-surface border border-subtle p-5 rounded-xl">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Aktueller Wert (Holdings)</span>
          <div className="text-2xl font-mono text-primary mt-2">${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-surface border border-subtle p-5 rounded-xl relative overflow-hidden">
          <div className={`absolute right-0 top-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${totalPnL >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Gesamt Gewinn/Verlust</span>
          <div className={`text-2xl font-mono mt-2 flex items-center gap-2 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            ${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] mt-1 space-x-2">
            <span className="text-emerald-500">Realisiert: ${realizedPnL.toFixed(2)}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-primary">Unrealisiert: ${unrealizedPnL.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Positions Section */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Holdings */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <DollarSign size={18} className="text-primary" /> Aktuelle Positionen
              </h3>
              <button onClick={openCreateModal} className="bg-primary hover:bg-lime-400 text-black font-bold py-1.5 px-3 rounded-lg flex items-center gap-2 text-sm transition-colors">
                <Plus size={16} /> Transaktion
              </button>
            </div>

            {holdings.length > 0 ? (
              <div className="overflow-hidden bg-surface/30 backdrop-blur rounded-xl border border-subtle">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-900/80 text-[10px] uppercase text-zinc-500 border-b border-subtle">
                    <tr>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3 text-right">Menge</th>
                      <th className="px-4 py-3 text-right">Kaufpreis</th>
                      <th className="px-4 py-3 text-right">Wert</th>
                      <th className="px-4 py-3 text-right">G/V</th>
                      <th className="px-4 py-3 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle/50">
                    {holdings.map(item => {
                      const asset = assets.find(a => a.symbol === item.assetSymbol);
                      const currentPrice = asset ? asset.price : item.buyPrice;
                      const val = currentPrice * item.amount;
                      const profit = val - (item.buyPrice * item.amount);
                      const profitPercent = ((currentPrice - item.buyPrice) / item.buyPrice) * 100;
                      return (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{item.assetSymbol.charAt(0)}</div>
                              <span className="font-bold">{item.assetSymbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-400">{item.amount}</td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-500">${item.buyPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-200">${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className={`px-4 py-3 text-right font-mono font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <div>{profit >= 0 ? '+' : ''}{profit.toFixed(2)}$</div>
                            <div className="text-[10px] opacity-70">{profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1 opacity-100">
                              <button onClick={() => openEditModal(item)} title="Bearbeiten" className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"><Edit3 size={14} /></button>
                              <button onClick={() => openSellModal(item)} title="Verkaufen" className="p-1.5 hover:bg-emerald-500/20 rounded text-emerald-400 transition-colors"><CheckCircle size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-zinc-600 bg-surface rounded-xl border border-subtle border-dashed">
                <p className="text-sm">Keine aktiven Positionen.</p>
              </div>
            )}
          </div>

          {/* Sold History */}
          {soldItems.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-subtle/30">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <History size={18} className="text-zinc-400" /> Verkaufshistorie
              </h3>
              <div className="overflow-hidden bg-surface/30 backdrop-blur rounded-xl border border-subtle">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-900/80 text-[10px] uppercase text-zinc-500 border-b border-subtle">
                    <tr>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3 text-right">Verkauft am</th>
                      <th className="px-4 py-3 text-right">Preis (Kauf → Verk.)</th>
                      <th className="px-4 py-3 text-right">Profit</th>
                      <th className="px-4 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle/50">
                    {soldItems.sort((a, b) => new Date(b.sellDate!).getTime() - new Date(a.sellDate!).getTime()).map(item => {
                      const buyVal = item.buyPrice * item.amount;
                      const sellVal = (item.sellPrice || 0) * item.amount;
                      const profit = sellVal - buyVal;
                      const profitPercent = ((sellVal - buyVal) / buyVal) * 100;
                      return (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors opacity-75 hover:opacity-100">
                          <td className="px-4 py-3 font-bold text-zinc-400">{item.assetSymbol}</td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-500">{new Date(item.sellDate!).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-zinc-500">${item.buyPrice}</span>
                              <ArrowRight size={10} className="text-zinc-600" />
                              <span className="text-zinc-300">${item.sellPrice}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {profit >= 0 ? '+' : ''}{profit.toFixed(2)}$ ({profitPercent.toFixed(1)}%)
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-rose-500/20 rounded text-zinc-600 hover:text-rose-400 transition-colors"><Trash2 size={12} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Distribution Chart Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-white flex items-center gap-2"><PieChart size={18} className="text-primary" /> Verteilung</h3>
            <div className="flex bg-zinc-800/50 rounded-lg p-0.5 border border-subtle">
              <button onClick={() => setChartView('ALLOCATION')} className={`p-1.5 rounded-md transition-colors ${chartView === 'ALLOCATION' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><PieChart size={14} /></button>
              <button onClick={() => setChartView('HISTORY')} className={`p-1.5 rounded-md transition-colors ${chartView === 'HISTORY' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><LineChart size={14} /></button>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-subtle p-6 min-h-[280px] flex items-center justify-center">
            {chartView === 'ALLOCATION' ? <DonutChart /> : <div className="text-zinc-600 text-sm text-center"><LineChart size={32} className="mx-auto mb-2 opacity-20" /><p>Verlauf kommt bald.</p></div>}
          </div>
        </div>
      </div>

      {/* Unified Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-subtle p-6">
            <h3 className="text-lg font-bold text-white mb-6">
              {modalMode === 'CREATE' ? 'Neue Transaktion' : modalMode === 'EDIT' ? 'Position bearbeiten' : 'Position verkaufen'}
            </h3>

            {modalMode === 'SELL' ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 mb-4 bg-zinc-900 p-3 rounded-lg border border-subtle">
                  Du verkaufst <span className="text-white font-bold">{selectedItem?.amount} {selectedItem?.assetSymbol}</span>.
                  Bitte gib Preis und Datum an.
                </p>
                <div>
                  <label className="text-zinc-500 text-xs font-medium uppercase mb-1 block">Verkaufspreis (pro Coin)</label>
                  <input type="number" value={formData.sellPrice} onChange={e => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) })} className="w-full bg-zinc-900 border border-subtle rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-medium uppercase mb-1 block">Verkaufsdatum</label>
                  <input type="date" value={formData.sellDate} onChange={e => setFormData({ ...formData, sellDate: e.target.value })} className="w-full bg-zinc-900 border border-subtle rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-zinc-500 text-xs font-medium uppercase mb-1 block">Symbol</label>
                  <input type="text" disabled={modalMode === 'EDIT'} value={formData.assetSymbol} onChange={e => setFormData({ ...formData, assetSymbol: e.target.value })} className="w-full bg-zinc-900 border border-subtle rounded-lg p-3 text-white focus:border-primary focus:outline-none disabled:opacity-50" placeholder="BTC" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-500 text-xs font-medium uppercase mb-1 block">Menge</label>
                    <input type="number" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="w-full bg-zinc-900 border border-subtle rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-xs font-medium uppercase mb-1 block">Kaufpreis ($)</label>
                    <input type="number" value={formData.buyPrice || ''} onChange={e => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) })} className="w-full bg-zinc-900 border border-subtle rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-medium uppercase mb-1 block">Kaufdatum</label>
                  <input type="date" value={formData.buyDate} onChange={e => setFormData({ ...formData, buyDate: e.target.value })} className="w-full bg-zinc-900 border border-subtle rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white px-4 py-2 transition-colors">Abbrechen</button>
              <button onClick={handleSave} className={`font-bold px-5 py-2 rounded-lg transition-colors ${modalMode === 'SELL' ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-primary hover:bg-lime-400 text-black'}`}>
                {modalMode === 'CREATE' ? 'Hinzufügen' : modalMode === 'EDIT' ? 'Speichern' : 'Verkaufen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PortfolioTracker;
