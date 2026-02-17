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
      sellPrice: asset ? asset.price : item.buyPrice,
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
      const updatedItems = items.map(i => i.id === selectedItem.id ? { ...i, ...formData, id: i.id } as PortfolioItem : i);
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

  const DonutChart = () => {
    if (allocation.length === 0) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Füge Assets hinzu.</div>;
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
              <span className="text-gray-500">{item.symbol}</span>
              <span className="text-gray-400 font-mono">{item.percentage.toFixed(1)}%</span>
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
        <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Gesamt Investiert</span>
          <div className="text-2xl font-mono text-gray-900 mt-2">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Aktueller Wert (Holdings)</span>
          <div className="text-2xl font-mono text-gray-900 mt-2">${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-xl relative overflow-hidden shadow-sm">
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Gesamt Gewinn/Verlust</span>
          <div className={`text-2xl font-mono mt-2 flex items-center gap-2 ${totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            ${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] mt-1 space-x-2">
            <span className="text-emerald-500">Realisiert: ${realizedPnL.toFixed(2)}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">Unrealisiert: ${unrealizedPnL.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Positions Section */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Holdings */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign size={18} className="text-gray-500" /> Aktuelle Positionen
              </h3>
              <button onClick={openCreateModal} className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-2 text-sm transition-colors">
                <Plus size={16} /> Transaktion
              </button>
            </div>

            {holdings.length > 0 ? (
              <div className="overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3 text-right">Menge</th>
                      <th className="px-4 py-3 text-right">Kaufpreis</th>
                      <th className="px-4 py-3 text-right">Wert</th>
                      <th className="px-4 py-3 text-right">G/V</th>
                      <th className="px-4 py-3 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {holdings.map(item => {
                      const asset = assets.find(a => a.symbol === item.assetSymbol);
                      const currentPrice = asset ? asset.price : item.buyPrice;
                      const val = currentPrice * item.amount;
                      const profit = val - (item.buyPrice * item.amount);
                      const profitPercent = ((currentPrice - item.buyPrice) / item.buyPrice) * 100;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700">{item.assetSymbol.charAt(0)}</div>
                              <span className="font-bold text-gray-900">{item.assetSymbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-500">{item.amount}</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-400">${item.buyPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-900">${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className={`px-4 py-3 text-right font-mono font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <div>{profit >= 0 ? '+' : ''}{profit.toFixed(2)}$</div>
                            <div className="text-[10px] opacity-70">{profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1 opacity-100">
                              <button onClick={() => openEditModal(item)} title="Bearbeiten" className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors"><Edit3 size={14} /></button>
                              <button onClick={() => openSellModal(item)} title="Verkaufen" className="p-1.5 hover:bg-emerald-50 rounded text-emerald-500 transition-colors"><CheckCircle size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                <p className="text-sm">Keine aktiven Positionen.</p>
              </div>
            )}
          </div>

          {/* Sold History */}
          {soldItems.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <History size={18} className="text-gray-400" /> Verkaufshistorie
              </h3>
              <div className="overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3 text-right">Verkauft am</th>
                      <th className="px-4 py-3 text-right">Preis (Kauf → Verk.)</th>
                      <th className="px-4 py-3 text-right">Profit</th>
                      <th className="px-4 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {soldItems.sort((a, b) => new Date(b.sellDate!).getTime() - new Date(a.sellDate!).getTime()).map(item => {
                      const buyVal = item.buyPrice * item.amount;
                      const sellVal = (item.sellPrice || 0) * item.amount;
                      const profit = sellVal - buyVal;
                      const profitPercent = ((sellVal - buyVal) / buyVal) * 100;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors opacity-75 hover:opacity-100">
                          <td className="px-4 py-3 font-bold text-gray-500">{item.assetSymbol}</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-400">{new Date(item.sellDate!).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-gray-400">${item.buyPrice}</span>
                              <ArrowRight size={10} className="text-gray-300" />
                              <span className="text-gray-700">${item.sellPrice}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {profit >= 0 ? '+' : ''}{profit.toFixed(2)}$ ({profitPercent.toFixed(1)}%)
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
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
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><PieChart size={18} className="text-gray-500" /> Verteilung</h3>
            <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
              <button onClick={() => setChartView('ALLOCATION')} className={`p-1.5 rounded-md transition-colors ${chartView === 'ALLOCATION' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><PieChart size={14} /></button>
              <button onClick={() => setChartView('HISTORY')} className={`p-1.5 rounded-md transition-colors ${chartView === 'HISTORY' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><LineChart size={14} /></button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6 min-h-[280px] flex items-center justify-center shadow-sm">
            {chartView === 'ALLOCATION' ? <DonutChart /> : <div className="text-gray-400 text-sm text-center"><LineChart size={32} className="mx-auto mb-2 opacity-20" /><p>Verlauf kommt bald.</p></div>}
          </div>
        </div>
      </div>

      {/* Unified Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {modalMode === 'CREATE' ? 'Neue Transaktion' : modalMode === 'EDIT' ? 'Position bearbeiten' : 'Position verkaufen'}
            </h3>

            {modalMode === 'SELL' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  Du verkaufst <span className="text-gray-900 font-bold">{selectedItem?.amount} {selectedItem?.assetSymbol}</span>.
                  Bitte gib Preis und Datum an.
                </p>
                <div>
                  <label className="text-gray-400 text-xs font-medium uppercase mb-1 block">Verkaufspreis (pro Coin)</label>
                  <input type="number" value={formData.sellPrice} onChange={e => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-gray-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium uppercase mb-1 block">Verkaufsdatum</label>
                  <input type="date" value={formData.sellDate} onChange={e => setFormData({ ...formData, sellDate: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-gray-400 focus:outline-none" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium uppercase mb-1 block">Symbol</label>
                  <input type="text" disabled={modalMode === 'EDIT'} value={formData.assetSymbol} onChange={e => setFormData({ ...formData, assetSymbol: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-gray-400 focus:outline-none disabled:opacity-50" placeholder="BTC" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-xs font-medium uppercase mb-1 block">Menge</label>
                    <input type="number" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-gray-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium uppercase mb-1 block">Kaufpreis ($)</label>
                    <input type="number" value={formData.buyPrice || ''} onChange={e => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-gray-400 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium uppercase mb-1 block">Kaufdatum</label>
                  <input type="date" value={formData.buyDate} onChange={e => setFormData({ ...formData, buyDate: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:border-gray-400 focus:outline-none" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 px-4 py-2 transition-colors">Abbrechen</button>
              <button onClick={handleSave} className={`font-bold px-5 py-2 rounded-lg transition-colors ${modalMode === 'SELL' ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
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
