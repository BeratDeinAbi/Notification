import React, { useState, useEffect } from 'react';
import type { AlertRule, Asset, Timeframe, ComparisonOperator, RuleCondition } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface RuleBuilderProps {
  assets: Asset[];
  onAddRule: (r: AlertRule) => void;
  onUpdateRule?: (r: AlertRule) => void;
  onCancel: () => void;
  editRule?: AlertRule | null;
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({ assets, onAddRule, onUpdateRule, onCancel, editRule }) => {
  const [assetId, setAssetId] = useState<string>('ALL_CRYPTO');
  const [timeframe, setTimeframe] = useState<Timeframe>('4h');
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');

  const [conditions, setConditions] = useState<RuleCondition[]>([
    { id: '1', indicator: 'RSI', operator: 'LESS_THAN', threshold: 30 }
  ]);

  // Load edit data
  useEffect(() => {
    if (editRule) {
      setAssetId(editRule.assetId);
      setTimeframe(editRule.timeframe);
      setLogic(editRule.logic || 'AND');

      if (editRule.conditions && editRule.conditions.length > 0) {
        setConditions(editRule.conditions);
      } else {
        // Fallback for legacy rules
        setConditions([{
          id: '1',
          indicator: editRule.indicator,
          operator: editRule.operator,
          threshold: editRule.threshold
        }]);
      }
    }
  }, [editRule]);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: Date.now().toString(), indicator: 'RSI', operator: 'LESS_THAN', threshold: 30 }
    ]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id));
    }
  };

  const updateCondition = (id: string, updates: Partial<RuleCondition>) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleSave = () => {
    const mainCondition = conditions[0];
    const rule: AlertRule = {
      id: editRule?.id || Date.now().toString(),
      assetId,
      timeframe,
      // Legacy fields filled with first condition for compat
      indicator: mainCondition.indicator,
      operator: mainCondition.operator,
      threshold: mainCondition.threshold,
      // New fields
      conditions,
      logic,
      active: editRule?.active ?? true
    };

    if (editRule && onUpdateRule) {
      onUpdateRule(rule);
    } else {
      onAddRule(rule);
    }
  };

  return (
    <div className="bg-surface w-full max-w-2xl rounded-2xl border border-subtle p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-surface pb-2 z-10 border-b border-subtle">
        <h3 className="text-white font-bold text-xl">{editRule ? 'Alarm bearbeiten' : 'Neuer Profi-Alarm'}</h3>
        <button onClick={onCancel} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Global Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-500 text-xs font-medium uppercase mb-2 block">Asset</label>
            <select
              className="w-full bg-zinc-900 border border-subtle p-3 rounded-xl text-white focus:border-primary focus:outline-none transition-colors"
              value={assetId}
              onChange={e => setAssetId(e.target.value)}
            >
              <option value="ALL_CRYPTO">Alle Krypto</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.symbol} {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-zinc-500 text-xs font-medium uppercase mb-2 block">Zeitrahmen</label>
            <select
              className="w-full bg-zinc-900 border border-subtle p-3 rounded-xl text-white focus:border-primary focus:outline-none transition-colors"
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as Timeframe)}
            >
              <option value="15m">15 Minuten</option>
              <option value="4h">4 Stunden</option>
              <option value="1d">Täglich</option>
              <option value="1w">Wöchentlich</option>
            </select>
          </div>
        </div>

        <div className="bg-zinc-900/30 rounded-xl p-4 border border-subtle/50">
          <div className="flex justify-between items-center mb-4">
            <label className="text-zinc-400 text-xs font-medium uppercase">Bedingungen</label>
            {conditions.length > 1 && (
              <select
                value={logic}
                onChange={(e) => setLogic(e.target.value as 'AND' | 'OR')}
                className="bg-zinc-950 text-xs border border-subtle rounded px-2 py-1 text-primary cursor-pointer"
              >
                <option value="AND">UND (Alle müssen eintreffen)</option>
                <option value="OR">ODER (Eine muss eintreffen)</option>
              </select>
            )}
          </div>

          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div key={condition.id} className="bg-zinc-950 rounded-xl p-3 border border-subtle relative group">
                {index > 0 && (
                  <div className="absolute -top-3 left-6 bg-zinc-800 text-[10px] px-2 rounded text-zinc-400 border border-zinc-700 z-10">
                    {logic === 'AND' ? 'UND' : 'ODER'}
                  </div>
                )}
                <div className="flex gap-3 items-start">
                  {/* Indicator Select */}
                  <div className="w-1/3">
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      <button
                        onClick={() => updateCondition(condition.id, { indicator: 'RSI', operator: 'LESS_THAN', threshold: 30 })}
                        className={`p-2 rounded-lg text-xs font-bold border transition-colors ${condition.indicator === 'RSI' ? 'bg-primary/20 border-primary text-primary' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >
                        RSI
                      </button>
                      <button
                        onClick={() => updateCondition(condition.id, { indicator: 'MACD', operator: 'CROSS_ABOVE' })}
                        className={`p-2 rounded-lg text-xs font-bold border transition-colors ${condition.indicator === 'MACD' ? 'bg-primary/20 border-primary text-primary' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >
                        MACD
                      </button>
                    </div>
                  </div>

                  {/* Operator & Threshold */}
                  <div className="flex-1 space-y-2">
                    <select
                      className="w-full bg-zinc-900 border border-subtle p-2 rounded-lg text-sm text-zinc-300 focus:border-primary focus:outline-none"
                      value={condition.operator}
                      onChange={e => updateCondition(condition.id, { operator: e.target.value as ComparisonOperator })}
                    >
                      {condition.indicator === 'RSI' ? (
                        <>
                          <option value="LESS_THAN">Kleiner als</option>
                          <option value="GREATER_THAN">Größer als</option>
                        </>
                      ) : (
                        <>
                          <option value="CROSS_ABOVE">Cross Bullish (nach oben)</option>
                          <option value="CROSS_BELOW">Cross Bearish (nach unten)</option>
                        </>
                      )}
                    </select>

                    {(condition.indicator === 'RSI' || condition.operator.includes('THAN')) && (
                      <input
                        type="number"
                        value={condition.threshold}
                        onChange={e => updateCondition(condition.id, { threshold: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-subtle p-2 rounded-lg text-sm text-white focus:border-primary focus:outline-none"
                        placeholder="Wert..."
                      />
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeCondition(condition.id)}
                    disabled={conditions.length === 1}
                    className="p-2 text-zinc-600 hover:text-rose-500 disabled:opacity-20 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {conditions.length < 3 && (
              <button
                onClick={addCondition}
                className="w-full py-2 border border-dashed border-subtle rounded-xl text-zinc-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all flex justify-center items-center gap-2 text-sm"
              >
                <Plus size={14} /> Bedingung hinzufügen
              </button>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-primary hover:bg-lime-400 text-black font-bold p-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          {editRule ? 'Alarm aktualisieren' : 'Alarm erstellen'}
        </button>
      </div>
    </div>
  );
};

export default RuleBuilder;
