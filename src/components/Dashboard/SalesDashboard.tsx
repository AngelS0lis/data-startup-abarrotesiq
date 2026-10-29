import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  TrendingUp,
  ShoppingBag,
  CircleDollarSign,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart3,
  CreditCard,
  Banknote,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  Check,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Trash2,
  X,
  Info
} from 'lucide-react';
import { Sale, Product } from '../../types';
import { usePOS } from '../../context/POSContext';
import { getLowStockProducts, LowStockInfo } from '../../utils/stockAlerts';
import { RestockModal } from '../RestockModal';
import { soundEffects } from '../../utils/audio';
import { getShadesForColor } from '../../utils/themeColors';

interface SalesDashboardProps {
  onBackToPOS?: () => void;
}

type DateRangeFilter = '7days' | '14days' | '30days' | 'today';
type TopSortBy = 'units' | 'revenue';

const CATEGORY_COLORS: Record<string, string> = {
  lacteos: '#3b82f6',       // Blue
  bebidas: '#06b6d4',       // Cyan
  botanas: '#f59e0b',       // Amber
  despensa: '#10b981',      // Emerald
  frutas_verduras: '#84cc16', // Lime
  panaderia: '#d97706',     // Warm orange
  limpieza: '#8b5cf6',      // Purple
  varios: '#64748b'         // Slate
};

const CATEGORY_NAMES: Record<string, string> = {
  lacteos: 'Lácteos & Cremería',
  bebidas: 'Bebidas & Refrescos',
  botanas: 'Botanas & Dulces',
  despensa: 'Abarrotes & Despensa',
  frutas_verduras: 'Frutas & Verduras',
  panaderia: 'Panadería & Tortillas',
  limpieza: 'Limpieza & Hogar',
  varios: 'Varios'
};

const BAR_COLORS = [
  '#059669', // Emerald 600
  '#0d9488', // Teal 600
  '#0284c7', // Sky 600
  '#2563eb', // Blue 600
  '#7c3aed', // Violet 600
  '#d97706', // Amber 600
  '#ea580c', // Orange 600
  '#e11d48'  // Rose 600
];

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ onBackToPOS }) => {
  const { sales, products, adjustStock, settings, setActiveTab, primaryColor, resetSales } = usePOS();

  const themeAccent = useMemo(() => {
    return getShadesForColor(primaryColor || settings.primaryColor || 'emerald')[600] || '#059669';
  }, [primaryColor, settings.primaryColor]);

  const [dateRange, setDateRange] = useState<DateRangeFilter>('7days');
  const [topSortBy, setTopSortBy] = useState<TopSortBy>('revenue');
  const [salesChartType, setSalesChartType] = useState<'area' | 'bar'>('area');
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [quickQtyInput, setQuickQtyInput] = useState<Record<string, string>>({});
  const [recentlyRestocked, setRecentlyRestocked] = useState<Record<string, number>>({});

  // Reset sales modal states
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [restoreStockOnReset, setRestoreStockOnReset] = useState<boolean>(false);
  const [resetShiftSalesOnReset, setResetShiftSalesOnReset] = useState<boolean>(true);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleConfirmResetSales = () => {
    resetSales({
      restoreStock: restoreStockOnReset,
      resetShiftSales: resetShiftSalesOnReset
    });
    if (settings.soundEnabled) {
      soundEffects.click();
    }
    setIsResetModalOpen(false);
    setResetSuccessMessage(
      restoreStockOnReset
        ? 'Se han reiniciado las ventas y se restauró el stock de los productos vendidos.'
        : 'Se ha reiniciado el historial de ventas. El dashboard y estadísticas ahora están en ceros.'
    );
    setTimeout(() => {
      setResetSuccessMessage(null);
    }, 4500);
  };

  // Calculate low stock products based on threshold
  const lowStockThreshold = settings.defaultMinStockThreshold ?? 5;
  const lowStockProducts = useMemo(() => {
    return getLowStockProducts(products, lowStockThreshold);
  }, [products, lowStockThreshold]);

  const handleQuickAdd = (productId: string, qty: number) => {
    adjustStock(productId, qty);
    if (settings.soundEnabled) {
      soundEffects.cashSuccess();
    }
    setRecentlyRestocked((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + qty
    }));

    setTimeout(() => {
      setRecentlyRestocked((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }, 3000);
  };

  const handleCustomAdd = (productId: string) => {
    const val = parseFloat(quickQtyInput[productId] || '0');
    if (!isNaN(val) && val > 0) {
      handleQuickAdd(productId, val);
      setQuickQtyInput((prev) => ({ ...prev, [productId]: '' }));
    }
  };

  // Helper to format currency
  const formatMoney = (val: number) =>
    `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // 1. Process Daily Sales for the selected date range
  const { dailySalesData, periodSales, totalRevenue, totalTickets, avgTicket, totalItemsSold } =
    useMemo(() => {
      const now = new Date();
      let daysCount = 7;
      if (dateRange === '14days') daysCount = 14;
      if (dateRange === '30days') daysCount = 30;

      // Group sales by day
      const dayMap: Record<string, { dateStr: string; label: string; total: number; tickets: number; items: number }> = {};

      if (dateRange === 'today') {
        // Today by hour intervals (from 07:00 to 22:00)
        const todayPrefix = now.toISOString().slice(0, 10);
        const filtered = sales.filter((s) => s.date.startsWith(todayPrefix));

        // Create hour buckets
        const hourMap: Record<number, { hourLabel: string; total: number; tickets: number; items: number }> = {};
        for (let h = 7; h <= 21; h++) {
          hourMap[h] = {
            hourLabel: `${h}:00`,
            total: 0,
            tickets: 0,
            items: 0
          };
        }

        let rev = 0;
        let itemsCount = 0;

        filtered.forEach((sale) => {
          rev += sale.total;
          const count = sale.items.reduce((acc, i) => acc + i.quantity, 0);
          itemsCount += count;

          // Parse hour
          const timePart = sale.date.split(' ')[1] || '';
          const hour = parseInt(timePart.split(':')[0], 10);
          if (!isNaN(hour) && hourMap[hour]) {
            hourMap[hour].total += sale.total;
            hourMap[hour].tickets += 1;
            hourMap[hour].items += count;
          }
        });

        const chartData = Object.keys(hourMap).map((k) => {
          const h = Number(k);
          return {
            name: hourMap[h].hourLabel,
            fullDate: `Hoy ${hourMap[h].hourLabel}`,
            ventas: Math.round(hourMap[h].total * 100) / 100,
            tickets: hourMap[h].tickets,
            articulos: hourMap[h].items
          };
        });

        return {
          dailySalesData: chartData,
          periodSales: filtered,
          totalRevenue: rev,
          totalTickets: filtered.length,
          avgTicket: filtered.length > 0 ? rev / filtered.length : 0,
          totalItemsSold: itemsCount
        };
      }

      // Generate date keys for the last N days
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const yyyyMmDd = d.toISOString().slice(0, 10);
        
        // E.g. "Lun 15" or "15 Sep"
        const dayName = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
        dayMap[yyyyMmDd] = {
          dateStr: yyyyMmDd,
          label: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          total: 0,
          tickets: 0,
          items: 0
        };
      }

      // Filter sales that fall in dateMap
      const filtered: Sale[] = [];
      let rev = 0;
      let itemsCount = 0;

      sales.forEach((sale) => {
        const saleDay = sale.date.slice(0, 10);
        if (dayMap[saleDay]) {
          filtered.push(sale);
          rev += sale.total;
          const count = sale.items.reduce((acc, i) => acc + i.quantity, 0);
          itemsCount += count;

          dayMap[saleDay].total += sale.total;
          dayMap[saleDay].tickets += 1;
          dayMap[saleDay].items += count;
        }
      });

      const chartData = Object.values(dayMap).map((d) => ({
        name: d.label,
        fullDate: d.dateStr,
        ventas: Math.round(d.total * 100) / 100,
        tickets: d.tickets,
        articulos: d.items,
        ticketPromedio: d.tickets > 0 ? Math.round((d.total / d.tickets) * 100) / 100 : 0
      }));

      return {
        dailySalesData: chartData,
        periodSales: filtered,
        totalRevenue: rev,
        totalTickets: filtered.length,
        avgTicket: filtered.length > 0 ? rev / filtered.length : 0,
        totalItemsSold: itemsCount
      };
    }, [sales, dateRange]);

  // 2. Process Top Selling Products from the period
  const topProductsData = useMemo(() => {
    const productAgg: Record<
      string,
      {
        id: string;
        name: string;
        category: string;
        emoji: string;
        image?: string;
        unit: string;
        quantitySold: number;
        revenue: number;
      }
    > = {};

    periodSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const pId = item.product.id;
        if (!productAgg[pId]) {
          productAgg[pId] = {
            id: pId,
            name: item.product.name,
            category: item.product.category,
            emoji: item.product.emoji || '📦',
            image: item.product.image,
            unit: item.product.unit,
            quantitySold: 0,
            revenue: 0
          };
        }
        productAgg[pId].quantitySold += item.quantity;
        productAgg[pId].revenue += item.total;
      });
    });

    const list = Object.values(productAgg);
    if (topSortBy === 'revenue') {
      list.sort((a, b) => b.revenue - a.revenue);
    } else {
      list.sort((a, b) => b.quantitySold - a.quantitySold);
    }

    return list.slice(0, 7).map((p) => ({
      name: p.name.length > 20 ? p.name.substring(0, 19) + '…' : p.name,
      fullName: p.name,
      emoji: p.emoji,
      image: p.image,
      category: p.category,
      cantidad: Math.round(p.quantitySold * 10) / 10,
      ingresos: Math.round(p.revenue * 100) / 100,
      unit: p.unit
    }));
  }, [periodSales, topSortBy]);

  // Best selling product star
  const topStarProduct = topProductsData[0];

  // 3. Category distribution (Pie Chart)
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    periodSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const cat = item.product.category || 'varios';
        catMap[cat] = (catMap[cat] || 0) + item.total;
      });
    });

    return Object.keys(catMap)
      .map((cat) => ({
        name: CATEGORY_NAMES[cat] || cat,
        key: cat,
        value: Math.round(catMap[cat] * 100) / 100,
        color: CATEGORY_COLORS[cat] || '#64748b'
      }))
      .sort((a, b) => b.value - a.value);
  }, [periodSales]);

  // 4. Payment method distribution
  const paymentData = useMemo(() => {
    const payMap: Record<string, { count: number; total: number }> = {
      efectivo: { count: 0, total: 0 },
      tarjeta: { count: 0, total: 0 },
      transferencia: { count: 0, total: 0 },
      fiado: { count: 0, total: 0 }
    };

    periodSales.forEach((sale) => {
      if (payMap[sale.paymentMethod]) {
        payMap[sale.paymentMethod].count += 1;
        payMap[sale.paymentMethod].total += sale.total;
      }
    });

    return [
      { name: 'Efectivo', total: payMap.efectivo.total, count: payMap.efectivo.count, color: '#10b981' },
      { name: 'Tarjeta', total: payMap.tarjeta.total, count: payMap.tarjeta.count, color: '#0284c7' },
      { name: 'Transferencia', total: payMap.transferencia.total, count: payMap.transferencia.count, color: '#8b5cf6' },
      { name: 'Fiado', total: payMap.fiado.total, count: payMap.fiado.count, color: '#f59e0b' }
    ].filter((p) => p.count > 0);
  }, [periodSales]);

  return (
    <div className="space-y-6">
      {/* Top Header & Range Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Dashboard de Ventas & Rendimiento
              </h2>
              <p className="text-xs text-slate-500">
                Análisis en tiempo real de ingresos diarios, tendencias y productos más demandados
              </p>
            </div>
          </div>
        </div>

        {/* Actions & Range Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-start sm:justify-end">
          {/* Date Range Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dateRange === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Hoy (Horas)
            </button>
            <button
              type="button"
              onClick={() => setDateRange('7days')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dateRange === '7days'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              type="button"
              onClick={() => setDateRange('14days')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dateRange === '14days'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              14 días
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dateRange === '30days'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              30 días
            </button>
          </div>

          {/* Reset Sales Button */}
          <button
            type="button"
            id="btn-reiniciar-ventas-dashboard"
            onClick={() => setIsResetModalOpen(true)}
            disabled={sales.length === 0}
            title={sales.length === 0 ? 'No hay ventas registradas actualmente' : 'Reiniciar o limpiar registro de ventas'}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-45 disabled:pointer-events-none transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
            <span>Reiniciar Ventas</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {resetSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-medium shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setResetSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">Ventas Totales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatMoney(totalRevenue)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{totalTickets} {totalTickets === 1 ? 'ticket cobrado' : 'tickets cobrados'}</span>
          </div>
        </div>

        {/* Average Ticket */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">Ticket Promedio</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatMoney(avgTicket)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            Por transacción de compra
          </div>
        </div>

        {/* Total Units / Items */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">Artículos Vendidos</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {Math.round(totalItemsSold * 10) / 10}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            Piezas y kilogramos despachados
          </div>
        </div>

        {/* Best-seller Product */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Producto Estrella</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate" title={topStarProduct?.fullName || 'Sin ventas'}>
            {topStarProduct ? (
              <span className="flex items-center gap-1.5 truncate">
                {topStarProduct.image ? (
                  <img src={topStarProduct.image} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                ) : (
                  <span className="text-lg">{topStarProduct.emoji}</span>
                )}
                <span className="truncate">{topStarProduct.fullName}</span>
              </span>
            ) : (
              'Sin ventas registradas'
            )}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-bold font-mono">
            {topStarProduct ? `${formatMoney(topStarProduct.ingresos)} (${topStarProduct.cantidad} ${topStarProduct.unit})` : '—'}
          </div>
        </div>

        {/* 5. Restock / Inventory Alert KPI Card */}
        <div
          id="dashboard-kpi-restock-card"
          onClick={() => setIsRestockModalOpen(true)}
          className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:shadow-md ${
            lowStockProducts.length > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 hover:border-amber-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Alerta de Resurtido
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                lowStockProducts.length > 0
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
              }`}
            >
              {lowStockProducts.length > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
              lowStockProducts.length > 0
                ? 'text-amber-950 dark:text-amber-100'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {lowStockProducts.length > 0
              ? `${lowStockProducts.length} ${lowStockProducts.length === 1 ? 'crítico' : 'críticos'}`
              : '0 alertas'}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span
              className={
                lowStockProducts.length > 0
                  ? 'text-amber-800 dark:text-amber-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {lowStockProducts.length > 0 ? 'Bajo el umbral' : 'Stock óptimo'}
            </span>
            <span className="text-amber-700 dark:text-amber-400 font-bold underline group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
              {lowStockProducts.length > 0 ? 'Resurtir →' : 'Ver'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Restocking Hub / Centro de Resurtido en el Dashboard */}
      {lowStockProducts.length > 0 ? (
        <div
          id="dashboard-restock-hub"
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-amber-200 dark:border-amber-800/80 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-800 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Centro de Resurtido Urgente
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {lowStockProducts.length} productos por debajo del umbral mínimo ({lowStockThreshold} {lowStockThreshold === 1 ? 'unidad' : 'unidades'})
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Reposición inmediata en 1 clic para garantizar existencia en mostrador
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Abrir Modal de Resurtido
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inventario')}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <span>Inventario</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table / Grid of low-stock items */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2.5 pl-1">Producto</th>
                  <th className="pb-2.5 px-2">Categoría</th>
                  <th className="pb-2.5 px-2 text-center">Stock Actual</th>
                  <th className="pb-2.5 px-2 text-center">Mínimo Configurado</th>
                  <th className="pb-2.5 px-2 text-center">Déficit</th>
                  <th className="pb-2.5 pr-1 text-right">Resurtir Rápido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowStockProducts.map((item) => {
                  const isRecentlyDone = Boolean(recentlyRestocked[item.product.id]);
                  const justAdded = recentlyRestocked[item.product.id];

                  return (
                    <tr key={item.product.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Product Name & Emoji */}
                      <td className="py-2.5 pl-1">
                        <div className="flex items-center gap-2.5">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
                            />
                          ) : (
                            <span className="text-2xl p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                              {item.product.emoji || '📦'}
                            </span>
                          )}
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block truncate max-w-[200px] sm:max-w-xs">
                              {item.product.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Cód: {item.product.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-2">
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          {CATEGORY_NAMES[item.product.category] || item.product.category}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`font-mono font-black text-xs px-2 py-0.5 rounded-md inline-block ${
                            item.currentStock <= 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {item.currentStock} {item.product.unit}
                        </span>
                      </td>

                      {/* Configured Minimum */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                        {item.minThreshold} {item.product.unit}
                      </td>

                      {/* Deficit */}
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-rose-600 dark:text-rose-400 font-mono font-bold text-[11px]">
                          -{Math.max(0, item.minThreshold - item.currentStock)} {item.product.unit}
                        </span>
                      </td>

                      {/* Quick Restock Actions */}
                      <td className="py-2.5 pr-1 text-right">
                        {isRecentlyDone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                            <Check className="w-3 h-3" />
                            +{justAdded} {item.product.unit}
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(item.product.id, 5)}
                              className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-md text-emerald-800 dark:text-emerald-300 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                              title="Sumar 5 unidades"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(item.product.id, 10)}
                              className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-md text-emerald-800 dark:text-emerald-300 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                              title="Sumar 10 unidades"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(item.product.id, 20)}
                              className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-md text-emerald-800 dark:text-emerald-300 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                              title="Sumar 20 unidades"
                            >
                              +20
                            </button>

                            <div className="flex items-center gap-0.5 ml-1">
                              <input
                                type="number"
                                min="1"
                                placeholder="Cant"
                                value={quickQtyInput[item.product.id] || ''}
                                onChange={(e) =>
                                  setQuickQtyInput({ ...quickQtyInput, [item.product.id]: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCustomAdd(item.product.id);
                                }}
                                className="w-12 p-0.5 text-[11px] font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleCustomAdd(item.product.id)}
                                className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-bold cursor-pointer"
                                title="Agregar cantidad personalizada"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          id="dashboard-restock-optimal-banner"
          className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold block">
                Inventario en Nivel Saludable
              </span>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                Todos los productos se encuentran por encima de su umbral mínimo configurado ({lowStockThreshold} {lowStockThreshold === 1 ? 'unidad' : 'unidades'}).
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('inventario')}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Ver Catálogo de Inventario
          </button>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 1. Daily Sales Chart (7 cols on desktop) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {dateRange === 'today' ? 'Ventas por Hora (Hoy)' : 'Evolución de Ventas Diarias'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {dailySalesData.length} {dateRange === 'today' ? 'horas' : 'días'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {dateRange === 'today'
                  ? 'Flujo de ingresos a lo largo del turno de hoy'
                  : 'Ingresos generados por fecha en moneda nacional (MXN)'}
              </p>
            </div>

            {/* Area vs Bar switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setSalesChartType('area')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                  salesChartType === 'area'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Curva
              </button>
              <button
                type="button"
                onClick={() => setSalesChartType('bar')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                  salesChartType === 'bar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Barras
              </button>
            </div>
          </div>

          {/* Recharts Daily Sales Container */}
          <div className="w-full h-72 sm:h-80">
            {dailySalesData.length === 0 || totalRevenue === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                <p>No hay ventas registradas en este período</p>
              </div>
            ) : salesChartType === 'area' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailySalesData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeAccent} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={themeAccent} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800 space-y-1">
                            <div className="font-bold text-slate-300">{data.fullDate || data.name}</div>
                            <div className="text-base font-black text-emerald-400 font-mono">
                              {formatMoney(data.ventas)}
                            </div>
                            <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800 flex justify-between gap-4">
                              <span>Tickets:</span>
                              <span className="font-bold text-white font-mono">{data.tickets}</span>
                            </div>
                            <div className="text-slate-400 text-[11px] flex justify-between gap-4">
                              <span>Artículos:</span>
                              <span className="font-bold text-white font-mono">{data.articulos}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke={themeAccent}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    activeDot={{ r: 6, fill: themeAccent, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailySalesData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800 space-y-1">
                            <div className="font-bold text-slate-300">{data.fullDate || data.name}</div>
                            <div className="text-base font-black text-emerald-400 font-mono">
                              {formatMoney(data.ventas)}
                            </div>
                            <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800 flex justify-between gap-4">
                              <span>Tickets:</span>
                              <span className="font-bold text-white font-mono">{data.tickets}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="ventas"
                    fill={themeAccent}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Top Selling Products Chart (5 cols on desktop) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>Top Productos Más Vendidos</span>
              </h3>
              <p className="text-xs text-slate-400">
                Los artículos con mayor rotación en el mostrador
              </p>
            </div>

            {/* Toggle Sort by Revenue vs Units */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setTopSortBy('revenue')}
                className={`px-2 py-1 text-[10.5px] font-bold rounded-md transition-colors ${
                  topSortBy === 'revenue'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Ordenar por dinero total generado"
              >
                Por $ Ingresos
              </button>
              <button
                type="button"
                onClick={() => setTopSortBy('units')}
                className={`px-2 py-1 text-[10.5px] font-bold rounded-md transition-colors ${
                  topSortBy === 'units'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Ordenar por cantidad de piezas o kilos"
              >
                Por Cantidad
              </button>
            </div>
          </div>

          {/* Horizontal Recharts BarChart */}
          <div className="w-full h-72 sm:h-80">
            {topProductsData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <ShoppingBag className="w-8 h-8 text-slate-300 mb-2" />
                <p>Sin productos registrados en este rango</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      topSortBy === 'revenue'
                        ? `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`
                        : `${v}`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    width={105}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800 space-y-1 min-w-[180px]">
                            <div className="font-bold flex items-center gap-1.5 text-slate-200">
                              {data.image ? (
                                <img src={data.image} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
                              ) : (
                                <span className="text-base">{data.emoji}</span>
                              )}
                              <span className="truncate">{data.fullName}</span>
                            </div>
                            <div className="text-xs text-slate-400">
                              Categoría: <span className="text-slate-200 font-semibold">{CATEGORY_NAMES[data.category] || data.category}</span>
                            </div>
                            <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center">
                              <span className="text-slate-400">Total vendido:</span>
                              <span className="font-black text-emerald-400 font-mono">
                                {formatMoney(data.ingresos)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Unidades:</span>
                              <span className="font-bold text-white font-mono">
                                {data.cantidad} {data.unit}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey={topSortBy === 'revenue' ? 'ingresos' : 'cantidad'}
                    radius={[0, 6, 6, 0]}
                  >
                    {topProductsData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Row: Categories and Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1">
            Ventas por Departamento / Categoría
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Participación de cada categoría sobre los ingresos totales
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-6 h-52 flex items-center justify-center">
              {categoryData.length === 0 ? (
                <span className="text-xs text-slate-400">Sin datos de categorías</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cat-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatMoney(Number(val)), 'Total']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend list */}
            <div className="sm:col-span-6 space-y-2 max-h-52 overflow-y-auto pr-1">
              {categoryData.slice(0, 5).map((cat) => {
                const percent = totalRevenue > 0 ? ((cat.value / totalRevenue) * 100).toFixed(1) : '0';
                return (
                  <div key={cat.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-slate-700 truncate">{cat.name}</span>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="font-bold text-slate-900 font-mono">{formatMoney(cat.value)}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1">
            Métodos de Pago Utilizados
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Ingresos clasificados por efectivo, tarjeta, transferencia y libreta de fiados
          </p>

          <div className="space-y-3.5">
            {paymentData.map((pay) => {
              const pct = totalRevenue > 0 ? (pay.total / totalRevenue) * 100 : 0;
              return (
                <div key={pay.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      {pay.name === 'Efectivo' && <Banknote className="w-4 h-4 text-emerald-600" />}
                      {pay.name === 'Tarjeta' && <CreditCard className="w-4 h-4 text-sky-600" />}
                      {pay.name === 'Transferencia' && <ArrowUpRight className="w-4 h-4 text-violet-600" />}
                      {pay.name === 'Fiado' && <Layers className="w-4 h-4 text-amber-600" />}
                      <span>{pay.name}</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        ({pay.count} {pay.count === 1 ? 'ticket' : 'tickets'})
                      </span>
                    </span>
                    <span className="font-black font-mono text-slate-900">
                      {formatMoney(pay.total)}
                      <span className="text-[10px] font-normal text-slate-400 ml-1">
                        ({pct.toFixed(1)}%)
                      </span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: pay.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Restock Modal from Dashboard */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        onNavigateToInventory={() => setActiveTab('inventario')}
      />

      {/* Modal de confirmación para reiniciar ventas */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Reiniciar Registro de Ventas</h3>
                  <p className="text-[11px] text-rose-100">Restablecer el historial y estadísticas del dashboard</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Summary of what will be reset */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">Ventas acumuladas a eliminar:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {sales.length} {sales.length === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">Total en dinero a reiniciar:</span>
                  <span className="font-mono font-black text-rose-600 text-sm">
                    {formatMoney(sales.reduce((acc, s) => acc + s.total, 0))}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={restoreStockOnReset}
                    onChange={(e) => setRestoreStockOnReset(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      ¿Restaurar inventario de productos vendidos?
                    </span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Devuelve al stock las unidades vendidas (recomendado si hiciste ventas de prueba).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={resetShiftSalesOnReset}
                    onChange={(e) => setResetShiftSalesOnReset(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      ¿Limpiar ventas del turno de caja actual?
                    </span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Pone en $0.00 las ventas cobradas en el turno activo para comenzar un corte de caja limpio.
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Importante:</strong> Las gráficas, ingresos totales y productos más vendidos se pondrán en $0.00. El catálogo de productos y tus clientes permanecerán guardados.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirmar-reiniciar-ventas"
                  onClick={handleConfirmResetSales}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Sí, Reiniciar Ventas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
