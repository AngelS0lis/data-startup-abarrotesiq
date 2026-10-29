import React, { useState } from 'react';
import { Scale, X, Check, DollarSign, Weight } from 'lucide-react';
import { Product } from '../../types';

interface BulkWeightModalProps {
  product: Product;
  onConfirm: (quantity: number, isBulk: boolean, bulkAmountInPesos?: number) => void;
  onClose: () => void;
}

export const BulkWeightModal: React.FC<BulkWeightModalProps> = ({
  product,
  onConfirm,
  onClose
}) => {
  const [mode, setMode] = useState<'money' | 'weight'>('weight');
  const [weightInput, setWeightInput] = useState<string>('0.500');
  const [moneyInput, setMoneyInput] = useState<string>('20.00');

  const pricePerKg = product.salePrice;

  // Calculators
  const parsedWeight = parseFloat(weightInput) || 0;
  const parsedMoney = parseFloat(moneyInput) || 0;

  const calculatedTotalFromWeight = parsedWeight * pricePerKg;
  const calculatedWeightFromMoney = pricePerKg > 0 ? parsedMoney / pricePerKg : 0;

  const handleConfirm = () => {
    if (mode === 'weight') {
      if (parsedWeight <= 0) return;
      onConfirm(parsedWeight, true);
    } else {
      if (parsedMoney <= 0) return;
      onConfirm(calculatedWeightFromMoney, true, parsedMoney);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">{product.name}</h2>
              <p className="text-xs text-slate-400">
                Precio por {product.unit}:{' '}
                <span className="text-emerald-400 font-mono font-semibold">
                  ${pricePerKg.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setMode('weight')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                mode === 'weight'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                  : 'hover:text-slate-900'
              }`}
            >
              <Weight className="w-4 h-4" />
              <span>Por Peso ({product.unit})</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('money')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                mode === 'money'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                  : 'hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Por Dinero ($ Pesos)</span>
            </button>
          </div>

          {/* Mode Weight Content */}
          {mode === 'weight' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Ingresar peso en kilogramos:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    autoFocus
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full text-2xl font-bold font-mono py-2.5 px-4 bg-slate-50 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-hidden text-slate-800"
                    placeholder="0.500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                    kg
                  </span>
                </div>
              </div>

              {/* Weight Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Atajos rápidos de peso:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { label: '¼ kg', val: '0.250' },
                    { label: '½ kg', val: '0.500' },
                    { label: '¾ kg', val: '0.750' },
                    { label: '1 kg', val: '1.000' },
                    { label: '1.5 kg', val: '1.500' },
                    { label: '2 kg', val: '2.000' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setWeightInput(preset.val)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        weightInput === preset.val
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Result */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-900">Total a cobrar:</span>
                <span className="text-xl font-bold font-mono text-emerald-700">
                  ${calculatedTotalFromWeight.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            /* Mode Money Content */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  ¿Cuánto dinero pide el cliente? ($ MXN):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">
                    $
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    autoFocus
                    value={moneyInput}
                    onChange={(e) => setMoneyInput(e.target.value)}
                    className="w-full text-2xl font-bold font-mono py-2.5 pl-9 pr-4 bg-slate-50 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-hidden text-slate-800"
                    placeholder="20.00"
                  />
                </div>
              </div>

              {/* Money Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Cantidades en pesos habituales:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {['10.00', '15.00', '20.00', '30.00', '50.00'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMoneyInput(val)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        moneyInput === val
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ${parseInt(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Result */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-900">Peso equivalente:</span>
                <span className="text-xl font-bold font-mono text-emerald-700">
                  {calculatedWeightFromMoney.toFixed(3)} kg
                  <span className="text-xs text-emerald-600 block font-sans font-normal">
                    ({Math.round(calculatedWeightFromMoney * 1000)} gramos)
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <Check className="w-4 h-4" />
              <span>Agregar al Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
