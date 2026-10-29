import React, { useState } from 'react';
import {
  AlertTriangle,
  Package,
  Plus,
  Check,
  X,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { getLowStockProducts, LowStockInfo } from '../utils/stockAlerts';
import { CATEGORIES } from '../data/initialData';
import { soundEffects } from '../utils/audio';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToInventory?: () => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  onNavigateToInventory
}) => {
  const { products, adjustStock, settings, setActiveTab } = usePOS();
  const [customQty, setCustomQty] = useState<Record<string, string>>({});
  const [recentlyRestocked, setRecentlyRestocked] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const lowStockItems: LowStockInfo[] = getLowStockProducts(
    products,
    settings.defaultMinStockThreshold ?? 5
  );

  const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

  const handleQuickAdd = (productId: string, qty: number) => {
    adjustStock(productId, qty);
    if (settings.soundEnabled) {
      soundEffects.cashSuccess();
    }
    setRecentlyRestocked((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + qty
    }));

    // Clear after 3 seconds
    setTimeout(() => {
      setRecentlyRestocked((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }, 3000);
  };

  const handleCustomAdd = (productId: string) => {
    const val = parseFloat(customQty[productId] || '0');
    if (!isNaN(val) && val > 0) {
      handleQuickAdd(productId, val);
      setCustomQty((prev) => ({ ...prev, [productId]: '' }));
    }
  };

  const handleGoToInventory = () => {
    onClose();
    if (onNavigateToInventory) {
      onNavigateToInventory();
    } else {
      setActiveTab('inventario');
    }
  };

  return (
    <div
      id="restock-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="restock-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/80 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Resurtido de Inventario
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {lowStockItems.length} {lowStockItems.length === 1 ? 'artículo crítico' : 'artículos críticos'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Productos con existencias iguales o inferiores al umbral mínimo configurado
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product list */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
          {lowStockItems.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                ¡Inventario en Nivel Óptimo!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No hay productos por debajo de su umbral mínimo en este momento. Todos los artículos cuentan con stock suficiente.
              </p>
            </div>
          ) : (
            lowStockItems.map((item) => {
              const catObj = categoryMap.get(item.product.category);
              const isRecentlyDone = Boolean(recentlyRestocked[item.product.id]);
              const justAddedQty = recentlyRestocked[item.product.id];

              return (
                <div
                  key={item.product.id}
                  className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Product details */}
                  <div className="flex items-start gap-3 min-w-0">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt=""
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl shrink-0 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        {item.product.emoji || '📦'}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.product.name}
                        </span>
                        {item.urgency === 'out_of_stock' ? (
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            Agotado
                          </span>
                        ) : item.urgency === 'critical' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Crítico
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Bajo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                        <span>Cód: {item.product.code}</span>
                        <span>·</span>
                        {catObj && (
                          <span className="text-slate-600 dark:text-slate-300">
                            {catObj.name}
                          </span>
                        )}
                      </div>

                      {/* Stock metrics pill */}
                      <div className="mt-1.5 flex items-center gap-2 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Stock actual:</span>
                        <span
                          className={`font-mono font-black px-1.5 py-0.5 rounded ${
                            item.currentStock <= 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.currentStock} {item.product.unit}
                        </span>
                        <span className="text-slate-400">/ Mínimo:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.minThreshold} {item.product.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Restock controls */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pl-10 sm:pl-0">
                    {isRecentlyDone ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg animate-in fade-in">
                        <Check className="w-3.5 h-3.5" />
                        + {justAddedQty} {item.product.unit} agregadas
                      </span>
                    ) : (
                      <>
                        <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden xs:inline">
                          Resurtir:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item.product.id, 5)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                          title="Sumar 5 unidades"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item.product.id, 10)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                          title="Sumar 10 unidades"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item.product.id, 20)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                          title="Sumar 20 unidades"
                        >
                          +20
                        </button>

                        {/* Custom input */}
                        <div className="flex items-center gap-1 ml-1">
                          <input
                            type="number"
                            min="1"
                            placeholder="Cant"
                            value={customQty[item.product.id] || ''}
                            onChange={(e) =>
                              setCustomQty({ ...customQty, [item.product.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCustomAdd(item.product.id);
                            }}
                            className="w-14 p-1 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleCustomAdd(item.product.id)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Aplicar cantidad personalizada"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            💡 Puede ajustar el umbral mínimo por producto en el módulo de Inventario.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleGoToInventory}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Ir a Inventario Completo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
