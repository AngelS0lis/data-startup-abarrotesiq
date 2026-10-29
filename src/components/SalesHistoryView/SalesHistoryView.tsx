import React, { useState } from 'react';
import {
  ReceiptText,
  Search,
  Printer,
  RotateCcw,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  BookUser,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Database,
  CloudOff
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Sale } from '../../types';
import { ReceiptModal } from '../POSView/ReceiptModal';

export const SalesHistoryView: React.FC = () => {
  const { sales, cancelSale } = usePOS();

  const [search, setSearch] = useState<string>('');
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);

  // Metrics
  const totalSalesAmount = sales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = sales.length;
  const averageTicket = totalTransactions > 0 ? totalSalesAmount / totalTransactions : 0;

  // Estimated profit from sales
  const estimatedProfit = sales.reduce((acc, sale) => {
    const saleCost = sale.items.reduce(
      (itemAcc, item) => itemAcc + item.product.costPrice * item.quantity,
      0
    );
    return acc + (sale.total - saleCost);
  }, 0);

  const filteredSales = sales.filter((sale) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const folioStr = sale.folio.toString();
    const customerStr = (sale.customerName || '').toLowerCase();
    const itemsStr = sale.items.map((i) => i.product.name.toLowerCase()).join(' ');
    return folioStr.includes(q) || customerStr.includes(q) || itemsStr.includes(q);
  });

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'efectivo':
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      case 'tarjeta':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'transferencia':
        return <QrCode className="w-4 h-4 text-purple-600" />;
      case 'fiado':
        return <BookUser className="w-4 h-4 text-amber-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ventas Totales
          </span>
          <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
            ${totalSalesAmount.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400">{totalTransactions} tickets emitidos</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ganancia Bruta Estimada
          </span>
          <span className="text-2xl font-black font-mono text-emerald-600 mt-1 block">
            ${estimatedProfit.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400">
            {totalSalesAmount > 0
              ? `${((estimatedProfit / totalSalesAmount) * 100).toFixed(1)}% margen promedio`
              : '0%'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ticket Promedio
          </span>
          <span className="text-2xl font-black font-mono text-blue-600 mt-1 block">
            ${averageTicket.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400">Gasto promedio por cliente</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Efectividad de Cobro
          </span>
          <span className="text-2xl font-black font-mono text-teal-600 mt-1 block">
            100%
          </span>
          <span className="text-[11px] text-slate-400">Inventario sincronizado</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="sales-history-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar venta por folio (ej. 1001), cliente o producto..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:border-emerald-500 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Folio</th>
                <th className="py-3 px-3">Fecha y Hora</th>
                <th className="py-3 px-3">Método</th>
                <th className="py-3 px-3">Detalle Artículos</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron registros de ventas.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
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
                            title="Sincronizada con Google Sheets"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sheets
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                            title="Guardada en almacenamiento local (IndexedDB) pendiente o local"
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
                    <td className="py-3.5 px-3 max-w-xs truncate text-slate-600">
                      {sale.items.map((i) => `${i.quantity} ${i.product.name}`).join(', ')}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-3 text-right font-black font-mono text-sm text-slate-900">
                      ${sale.total.toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleForPrint(sale)}
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Reimprimir Ticket"
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
                          className="py-1 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors"
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
