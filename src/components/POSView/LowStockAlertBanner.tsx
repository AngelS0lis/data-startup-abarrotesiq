import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Package,
  X,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { getLowStockProducts } from '../../utils/stockAlerts';
import { soundEffects } from '../../utils/audio';

interface LowStockAlertBannerProps {
  onOpenRestockModal: () => void;
  onGoToInventory: () => void;
}

export const LowStockAlertBanner: React.FC<LowStockAlertBannerProps> = ({
  onOpenRestockModal,
  onGoToInventory
}) => {
  const { products, settings } = usePOS();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const isEnabled = settings.lowStockAlertEnabled ?? true;
  const threshold = settings.defaultMinStockThreshold ?? 5;
  const lowStockItems = getLowStockProducts(products, threshold);

  // Play alert sound once on mount when low stock is detected
  useEffect(() => {
    if (isEnabled && lowStockItems.length > 0 && settings.soundEnabled) {
      // Short delay to avoid audio lock on first click
      const timer = setTimeout(() => {
        soundEffects.alert();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isEnabled, lowStockItems.length, settings.soundEnabled]);

  if (!isEnabled || lowStockItems.length === 0) {
    return null;
  }

  // If dismissed by user, render a discreet chip so they can still access it anytime
  if (isDismissed) {
    return (
      <div className="mb-3 flex items-center justify-between px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-800 dark:text-amber-300 animate-in fade-in duration-150">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-semibold">
            {lowStockItems.length} {lowStockItems.length === 1 ? 'producto requiere resurtido' : 'productos requieren resurtido'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenRestockModal}
            className="font-bold underline hover:text-amber-950 dark:hover:text-amber-200 cursor-pointer"
          >
            Ver lista
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(false)}
            className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            title="Expandir alerta"
          >
            Mostrar
          </button>
        </div>
      </div>
    );
  }

  const outOfStockCount = lowStockItems.filter((i) => i.currentStock <= 0).length;
  const sampleItems = lowStockItems.slice(0, 3);

  return (
    <div
      id="pos-low-stock-notification-banner"
      role="alert"
      className="mb-4 bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 dark:from-amber-950/70 dark:via-amber-900/40 dark:to-orange-950/50 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl p-3 sm:p-3.5 shadow-sm animate-in slide-in-from-top-2 duration-200 relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Icon & Alert details */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative shrink-0 mt-0.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-300 dark:border-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            {outOfStockCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-100">
                Alerta de Inventario y Resurtido
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'por agotarse' : 'por agotarse'}
              </span>
              {outOfStockCount > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {outOfStockCount} {outOfStockCount === 1 ? 'agotado' : 'agotados'}
                </span>
              )}
            </div>

            {/* Product preview pills */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-amber-900/80 dark:text-amber-300/80 font-medium text-[11px]">
                Artículos críticos:
              </span>
              {sampleItems.map((item) => (
                <span
                  key={item.product.id}
                  className="inline-flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 shadow-2xs"
                >
                  {item.product.image ? (
                    <img src={item.product.image} alt="" className="w-3.5 h-3.5 rounded object-cover shrink-0" />
                  ) : (
                    <span>{item.product.emoji || '📦'}</span>
                  )}
                  <span className="truncate max-w-[120px]">{item.product.name}</span>
                  <span
                    className={`font-mono font-bold ${
                      item.currentStock <= 0 ? 'text-rose-600' : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    ({item.currentStock}/{item.minThreshold} {item.product.unit})
                  </span>
                </span>
              ))}
              {lowStockItems.length > 3 && (
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  +{lowStockItems.length - 3} más
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center pl-12 md:pl-0">
          <button
            type="button"
            id="btn-pos-quick-restock"
            onClick={onOpenRestockModal}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
            title="Abrir panel rápido de resurtido"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Ver y Resurtir</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onGoToInventory}
            className="px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            title="Ver catálogo completo en inventario"
          >
            Inventario
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-200/60 dark:hover:bg-amber-900/60 rounded-lg transition-colors cursor-pointer"
            title="Ocultar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
