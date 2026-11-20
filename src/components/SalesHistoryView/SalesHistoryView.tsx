import React, { useState, useMemo } from 'react';
import {
  Search,
  Printer,
  RotateCcw,
  Calendar,
  CreditCard,
  Banknote,
  BookUser,
  DollarSign,
  CheckCircle2,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Sale } from '../../types';
import { DAILY_SALES_VS_EXPENSES } from '../../data/initialData';
import { ReceiptModal } from '../POSView/ReceiptModal';

const PAGE_SIZE = 50;

export const SalesHistoryView: React.FC = () => {
  const { sales, cancelSale } = usePOS();

  const [search, setSearch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);

  // Available operating dates from dataset (sorted most recent first)
  const operatingDates = useMemo(() => {
    return DAILY_SALES_VS_EXPENSES.slice().reverse();
  }, []);

  // Filtered sales by date & search query
  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((sale) => {
      if (selectedDate !== 'all' && !sale.date.startsWith(selectedDate)) {
        return false;
      }
      if (!q) return true;
      const folioStr = sale.folio.toString();
      const customerStr = (sale.customerName || '').toLowerCase();
      const itemsStr = sale.items.map((i) => i.product.name.toLowerCase()).join(' ');
      return folioStr.includes(q) || customerStr.includes(q) || itemsStr.includes(q);
    });
  }, [sales, selectedDate, search]);

  // Metrics for current selection
  const totalSalesAmount = useMemo(
    () => filteredSales.reduce((sum, s) => sum + s.total, 0),
    [filteredSales]
  );
  const totalTransactions = filteredSales.length;
  const averageTicket = totalTransactions > 0 ? totalSalesAmount / totalTransactions : 0;

  // Real supplier expenses for the selected date (or all 122 days)
  const { totalSupplierExpenses, totalSupplierPayments } = useMemo(() => {
    if (selectedDate === 'all') {
      return {
        totalSupplierExpenses: DAILY_SALES_VS_EXPENSES.reduce((acc, d) => acc + d.gastos, 0),
        totalSupplierPayments: DAILY_SALES_VS_EXPENSES.reduce((acc, d) => acc + d.pagos_prov, 0)
      };
    }
    const dayObj = DAILY_SALES_VS_EXPENSES.find((d) => d.fecha === selectedDate);
    return {
      totalSupplierExpenses: dayObj ? dayObj.gastos : 0,
      totalSupplierPayments: dayObj ? dayObj.pagos_prov : 0
    };
  }, [selectedDate]);

  const netRealProfit = totalSalesAmount - totalSupplierExpenses;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSales = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSales.slice(start, start + PAGE_SIZE);
  }, [filteredSales, safePage]);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'efectivo':
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      case 'tarjeta':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'fiado':
        return <BookUser className="w-4 h-4 text-amber-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      {/* Metrics Banner (Ventas de Tickets vs. Gastos de Proveedores) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ventas Totales (Tickets)
          </span>
          <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
            ${totalSalesAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400">
            {totalTransactions.toLocaleString('es-MX')} tickets emitidos ({selectedDate === 'all' ? '122 días' : selectedDate})
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Gastos Proveedores (Libretas)
          </span>
          <span className="text-2xl font-black font-mono text-rose-600 mt-1 block">
            -${totalSupplierExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400">
            {totalSupplierPayments.toLocaleString('es-MX')} pagos reales a repartidores
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ganancia Neta Real (Caja)
          </span>
          <span
            className={`text-2xl font-black font-mono mt-1 block ${
              netRealProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            ${netRealProfit.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400">
            {totalSalesAmount > 0
              ? `${((netRealProfit / totalSalesAmount) * 100).toFixed(1)}% margen libre tras proveedores`
              : '0%'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ticket Promedio
          </span>
          <span className="text-2xl font-black font-mono text-blue-600 mt-1 block">
            ${averageTicket.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400">Precios cerrados · Efectivo y Tarjeta</span>
        </div>
      </div>

      {/* Search Bar & Operating Date Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="sales-history-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar ticket por folio (ej. 1001 a 8815) o producto (ej. Cheetos, Coca-Cola, Lala, Bolillo)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:border-emerald-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Todas las fechas (122 días · 05/06/2026 al 23/10/2026)</option>
              {operatingDates.map((d) => (
                <option key={d.fecha} value={d.fecha}>
                  {d.fecha_mx} — Venta: ${d.ventas.toLocaleString('es-MX')} ({d.tickets} tickets) | Gasto: ${d.gastos.toLocaleString('es-MX')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-700">
            Mostrando {(safePage - 1) * PAGE_SIZE + (filteredSales.length > 0 ? 1 : 0)}–
            {Math.min(safePage * PAGE_SIZE, filteredSales.length)} de{' '}
            <strong className="text-emerald-700">{filteredSales.length.toLocaleString('es-MX')}</strong> tickets de compra
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
              <span className="px-2 font-mono font-bold text-slate-700">
                Pág. {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Folio Ticket</th>
                <th className="py-3 px-3">Fecha y Hora</th>
                <th className="py-3 px-3">Turno</th>
                <th className="py-3 px-3">Método</th>
                <th className="py-3 px-3">Artículos Comprados en el Ticket (Cantidad × Producto = Subtotal)</th>
                <th className="py-3 px-3 text-right">Total Ticket</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron tickets de venta para este filtro.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Folio & Sync Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          #{sale.folio}
                        </span>
                        {sale.syncedToSheets ? (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
                            title="Sincronizada en AWS S3 Data Lake"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            S3
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                            title="Guardada en almacenamiento local"
                          >
                            <Database className="w-3 h-3 text-indigo-500" />
                            Local
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                      {sale.date}
                    </td>

                    {/* Cashier / Shift */}
                    <td className="py-3.5 px-3 text-slate-600 text-xs font-semibold whitespace-nowrap">
                      {sale.cashier}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getPaymentIcon(sale.paymentMethod)}
                        <span className="capitalize font-semibold text-slate-800">
                          {sale.paymentMethod}
                        </span>
                        {sale.customerName && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                            {sale.customerName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Items Summary */}
                    <td className="py-3.5 px-3 text-slate-700">
                      <div className="flex flex-wrap gap-1.5">
                        {sale.items.map((i, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                          >
                            <strong className="font-mono text-emerald-700">{i.quantity}×</strong>
                            <span>{i.product.name}</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              (${i.unitPrice} → <strong>${i.total}</strong>)
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-3 text-right font-black font-mono text-sm text-slate-900 whitespace-nowrap">
                      ${sale.total.toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleForPrint(sale)}
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Ver / Reimprimir Ticket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `¿Seguro que deseas cancelar la venta #${sale.folio}? Los productos regresarán automáticamente al inventario.`
                              )
                            ) {
                              cancelSale(sale.id);
                            }
                          }}
                          className="py-1 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Cancelar y devolver a inventario"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Reprint Modal */}
      {selectedSaleForPrint && (
        <ReceiptModal
          sale={selectedSaleForPrint}
          onClose={() => setSelectedSaleForPrint(null)}
        />
      )}
    </div>
  );
};
