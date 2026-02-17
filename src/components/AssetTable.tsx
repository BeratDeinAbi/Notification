import React, { useState, useMemo } from 'react';
import type { Asset, Timeframe } from '../types';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface AssetTableProps {
  assets: Asset[];
  timeframe: Timeframe;
}

type SortField = 'none' | 'change' | 'rsi' | 'macd';
type SortDirection = 'asc' | 'desc';

const AssetTable: React.FC<AssetTableProps> = ({ assets, timeframe }) => {
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortField('none');
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAssets = useMemo(() => {
    if (sortField === 'none') return assets;

    return [...assets].sort((a, b) => {
      let valueA: number;
      let valueB: number;

      if (sortField === 'rsi') {
        valueA = a.rsi[timeframe];
        valueB = b.rsi[timeframe];
      } else if (sortField === 'change') {
        valueA = a.change[timeframe];
        valueB = b.change[timeframe];
      } else {
        valueA = a.macd[timeframe].histogram;
        valueB = b.macd[timeframe].histogram;
      }

      if (sortDirection === 'desc') {
        return valueB - valueA;
      } else {
        return valueA - valueB;
      }
    });
  }, [assets, sortField, sortDirection, timeframe]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="opacity-20 transition-opacity group-hover:opacity-50" />;
    }
    return sortDirection === 'desc'
      ? <ArrowDown size={14} className="text-gray-900" />
      : <ArrowUp size={14} className="text-gray-900" />;
  };

  const getRsiColor = (rsi: number) => {
    if (rsi < 30) return 'text-emerald-600 font-bold';
    if (rsi > 70) return 'text-rose-600 font-bold';
    return 'text-gray-500';
  };

  const getMacdStatus = (asset: Asset) => {
    const m = asset.macd[timeframe];
    const hist = m.histogram;
    const prevHist = m.prevHistogram || 0;
    let barColor = hist >= 0 ? 'bg-emerald-400' : 'bg-rose-400';

    if (hist >= 0 && hist < prevHist) barColor = 'bg-emerald-300';
    if (hist < 0 && hist > prevHist) barColor = 'bg-rose-300';

    return (
      <div className="flex items-center justify-center gap-3">
        <div className="flex flex-col items-center justify-center h-8 w-1 bg-gray-100 rounded-full relative overflow-visible">
          <div
            className={`absolute w-2 rounded-full transition-all duration-500 ${barColor}`}
            style={{
              height: `${Math.max(4, Math.min(24, Math.abs(hist) * 8))}px`,
              bottom: hist >= 0 ? '50%' : 'auto',
              top: hist < 0 ? '50%' : 'auto'
            }}
          />
        </div>
        <div className="flex flex-col items-start w-16">
          <span className={`text-xs font-bold tabular-nums tracking-wide ${hist >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{hist.toFixed(2)}</span>
          <span className="text-[9px] text-gray-400 font-mono uppercase tracking-wider">Hist</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="text-xs uppercase text-gray-400 font-semibold border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-4 pl-8 font-medium tracking-wider w-1/4">Asset</th>
            <th className="px-6 py-4 font-medium text-right tracking-wider">Preis</th>
            <th
              className="px-6 py-4 font-medium text-right tracking-wider cursor-pointer hover:text-gray-700 transition-colors select-none group"
              onClick={() => handleSort('change')}
            >
              <div className="flex items-center justify-end gap-2">
                24h Change
                {getSortIcon('change')}
              </div>
            </th>
            <th
              className="px-6 py-4 font-medium text-center tracking-wider cursor-pointer hover:text-gray-700 transition-colors select-none group"
              onClick={() => handleSort('rsi')}
            >
              <div className="flex items-center justify-center gap-2">
                RSI
                {getSortIcon('rsi')}
              </div>
            </th>
            <th
              className="px-6 py-4 font-medium text-center tracking-wider cursor-pointer hover:text-gray-700 transition-colors select-none group"
              onClick={() => handleSort('macd')}
            >
              <div className="flex items-center justify-center gap-2">
                Momentum (MACD)
                {getSortIcon('macd')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sortedAssets.map((asset, index) => (
            <tr key={asset.id} className="hover:bg-gray-50/60 transition-all duration-200 group relative">
              <td className="px-6 py-4 pl-8">
                <div className="flex items-center gap-4">
                  {sortField !== 'none' && (
                    <span className={`text-[10px] font-mono w-4 text-center rounded ${index < 3 ? 'bg-gray-900 text-white font-bold px-0.5' : 'text-gray-400'}`}>
                      {index + 1}
                    </span>
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${asset.type === 'CRYPTO' ? 'bg-gray-100 text-gray-700' : 'bg-black text-white'}`}>
                    {asset.symbol.substring(0, 1)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm tracking-tight group-hover:text-gray-700 transition-colors">{asset.symbol}</div>
                    <div className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">{asset.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right font-mono font-medium text-gray-700 text-sm tabular-nums tracking-wide">
                ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className={`px-6 py-4 text-right ${sortField === 'change' ? 'bg-gray-50/50' : ''}`}>
                <div className={`inline-flex items-center justify-end gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${asset.change[timeframe] >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
                  {asset.change[timeframe] >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(asset.change[timeframe]).toFixed(2)}%
                </div>
              </td>
              <td className={`px-6 py-4 text-center font-mono text-sm tabular-nums ${sortField === 'rsi' ? 'bg-gray-50/50' : ''}`}>
                <span className={getRsiColor(asset.rsi[timeframe])}>{Math.round(asset.rsi[timeframe])}</span>
              </td>
              <td className={`px-6 py-4 text-center ${sortField === 'macd' ? 'bg-gray-50/50' : ''}`}>{getMacdStatus(asset)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default AssetTable;
