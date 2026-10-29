import React, { useState } from 'react';
import {
  Calculator,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  DollarSign,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Printer
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';

export const CashShiftView: React.FC = () => {
  const { cashShift, sales, addCashMovement, closeShift, startNewShift } = usePOS();

  // Cash movement modal
  const [movementType, setMovementType] = useState<'entrada' | 'salida'>('salida');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementReason, setMovementReason] = useState<string>('');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);

  // Arqueo / Cash counter state
  const [countedCashInput, setCountedCashInput] = useState<string>('');
  const [isClosingShift, setIsClosingShift] = useState<boolean>(false);

  // New shift prompt
  const [newShiftInitialCash, setNewShiftInitialCash] = useState<string>('500');
  const [isNewShiftModalOpen, setIsNewShiftModalOpen] = useState<boolean>(false);

  // Calculate shift figures
  const shiftSales = sales.filter((s) => {
    // sales occurring today or after shift opened
    return s.date >= cashShift.openedAt;
  });

  const cashSalesTotal = shiftSales
    .filter((s) => s.paymentMethod === 'efectivo')
    .reduce((sum, s) => sum + s.total, 0);

  const cardSalesTotal = shiftSales
    .filter((s) => s.paymentMethod === 'tarjeta')
    .reduce((sum, s) => sum + s.total, 0);

  const transferSalesTotal = shiftSales
    .filter((s) => s.paymentMethod === 'transferencia')
    .reduce((sum, s) => sum + s.total, 0);

  const fiadoSalesTotal = shiftSales
    .filter((s) => s.paymentMethod === 'fiado')
    .reduce((sum, s) => sum + s.total, 0);

  const totalEntradas = cashShift.movements
    .filter((m) => m.type === 'entrada')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalSalidas = cashShift.movements
    .filter((m) => m.type === 'salida')
    .reduce((sum, m) => sum + m.amount, 0);

  // Expected physical cash in drawer:
  // Fondo Inicial + Ventas Efectivo + Entradas - Salidas
  const expectedCashInDrawer =
    cashShift.initialCash + cashSalesTotal + totalEntradas - totalSalidas;

  const countedCash = parseFloat(countedCashInput) || 0;
  const cashDifference = countedCash - expectedCashInDrawer;

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(movementAmount) || 0;
    if (amt <= 0 || !movementReason.trim()) return;

    addCashMovement(movementType, amt, movementReason.trim());
    setMovementAmount('');
    setMovementReason('');
    setIsMovementModalOpen(false);
  };

  const handleCloseShiftConfirm = () => {
    closeShift(countedCash);
    setIsClosingShift(false);
  };

  const handleStartShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const init = parseFloat(newShiftInitialCash) || 0;
    startNewShift(init);
    setIsNewShiftModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      {/* Header Banner */}
      <div
        style={{ backgroundColor: 'var(--header-bg-color, #0f172a)' }}
        className="text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">Corte y Arqueo de Caja</h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                cashShift.status === 'open'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {cashShift.status === 'open' ? 'Turno en Curso' : 'Turno Cerrado'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Turno iniciado: <span className="font-mono text-slate-200">{cashShift.openedAt}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {cashShift.status === 'open' ? (
            <>
              <button
                type="button"
                id="btn-add-movement"
                onClick={() => setIsMovementModalOpen(true)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Entrada / Salida</span>
              </button>
              <button
                type="button"
                id="btn-close-shift"
                onClick={() => {
                  setCountedCashInput(expectedCashInDrawer.toFixed(2));
                  setIsClosingShift(true);
                }}
                className="py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Turno</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsNewShiftModalOpen(true)}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Nuevo Turno</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fondo Inicial */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Fondo Inicial (Caja Chica)
          </span>
          <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
            ${cashShift.initialCash.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400">Dinero para dar cambio</span>
        </div>

        {/* Ventas en Efectivo */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ventas en Efectivo
          </span>
          <span className="text-2xl font-black font-mono text-emerald-600 mt-1 block">
            +${cashSalesTotal.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400">Ingresado al cajón</span>
        </div>

        {/* Entradas Extras */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Entradas / Abonos
          </span>
          <span className="text-2xl font-black font-mono text-teal-600 mt-1 block">
            +${totalEntradas.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400">Abonos de clientes y aportes</span>
        </div>

        {/* Salidas / Gastos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Salidas / Pagos
          </span>
          <span className="text-2xl font-black font-mono text-rose-600 mt-1 block">
            -${totalSalidas.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400">Proveedores, retiros y gastos</span>
        </div>
      </div>

      {/* Expected Cash in Drawer & Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Calculation Box & Drawer Balancer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Efectivo Esperado en el Cajón
              </h3>
              <p className="text-xs text-slate-500">
                Fondo + Ventas Efectivo + Entradas - Salidas
              </p>
            </div>
            <span className="text-3xl font-black font-mono text-emerald-700">
              ${expectedCashInDrawer.toFixed(2)}
            </span>
          </div>

          {/* Arqueo de Dinero Físico */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-slate-500" />
                <span>Arqueo / Dinero Físico Contado:</span>
              </span>
              <button
                type="button"
                onClick={() => setCountedCashInput(expectedCashInDrawer.toFixed(2))}
                className="text-[11px] text-emerald-700 font-bold hover:underline"
              >
                Copiar esperado (cuadre exacto)
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xl text-slate-400">
                $
              </span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={countedCashInput}
                onChange={(e) => setCountedCashInput(e.target.value)}
                placeholder="Ingresa la suma de billetes y monedas que contaste..."
                className="w-full text-2xl font-black font-mono py-2 pl-9 pr-3 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            {countedCashInput && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between font-mono text-sm font-bold ${
                  Math.abs(cashDifference) < 0.01
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : cashDifference > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <span>
                  {Math.abs(cashDifference) < 0.01
                    ? '¡Caja cuadrada a la perfección!'
                    : cashDifference > 0
                    ? 'Sobrante en caja:'
                    : 'Faltante en caja:'}
                </span>
                <span className="text-lg">
                  {cashDifference > 0 ? '+' : ''}${cashDifference.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Other Payment Methods Summary */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Otros Métodos de Cobro (No Efectivo)
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                <span className="text-blue-800 block font-semibold">Tarjeta</span>
                <span className="text-base font-black font-mono text-blue-900">
                  ${cardSalesTotal.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl">
                <span className="text-purple-800 block font-semibold">Transferencia</span>
                <span className="text-base font-black font-mono text-purple-900">
                  ${transferSalesTotal.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-amber-800 block font-semibold">Fiado a Clientes</span>
                <span className="text-base font-black font-mono text-amber-900">
                  ${fiadoSalesTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Cash Movements Log (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900">Movimientos de Efectivo</h3>
            <button
              type="button"
              onClick={() => setIsMovementModalOpen(true)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Registrar</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {cashShift.movements.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs">
                No hay movimientos registrados en este turno.
              </p>
            ) : (
              cashShift.movements.map((mov) => {
                const isEntrada = mov.type === 'entrada';
                return (
                  <div
                    key={mov.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                          isEntrada
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isEntrada ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{mov.reason}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{mov.time} hrs</span>
                      </div>
                    </div>

                    <span
                      className={`font-black font-mono text-sm ${
                        isEntrada ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {isEntrada ? '+' : '-'}${mov.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Movement Modal (Entrada/Salida) */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Registrar Movimiento de Efectivo
            </h3>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMovementType('salida')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  movementType === 'salida'
                    ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
                    : 'text-slate-600'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5" />
                <span>Salida (Gasto/Pago)</span>
              </button>
              <button
                type="button"
                onClick={() => setMovementType('entrada')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  movementType === 'entrada'
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                    : 'text-slate-600'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Entrada de Dinero</span>
              </button>
            </div>

            <form onSubmit={handleAddMovement} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monto ($ MXN):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  autoFocus
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full text-2xl font-black font-mono py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo / Concepto:
                </label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  placeholder="ej. Pago a repartidor de Pan Bimbo, compra de bolsas..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Confirmation */}
      {isClosingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900">Confirmar Cierre de Turno</h3>
            <p className="text-xs text-slate-600">
              Se guardará el arqueo de caja con el conteo final de efectivo y el resumen de ventas.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Efectivo esperado:</span>
                <span className="font-mono font-bold">${expectedCashInDrawer.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Efectivo contado:</span>
                <span className="font-mono font-bold">${countedCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                <span>Diferencia:</span>
                <span
                  className={`font-mono ${
                    Math.abs(cashDifference) < 0.01
                      ? 'text-emerald-700'
                      : cashDifference > 0
                      ? 'text-blue-700'
                      : 'text-rose-600'
                  }`}
                >
                  {cashDifference > 0 ? '+' : ''}${cashDifference.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClosingShift(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleCloseShiftConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Confirmar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Shift Modal */}
      {isNewShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Abrir Nuevo Turno de Caja</h3>
            <p className="text-xs text-slate-500">
              Ingresa el fondo inicial en morralla y billetes con el que se inicia la jornada:
            </p>

            <form onSubmit={handleStartShiftSubmit} className="space-y-3">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xl text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="10"
                  min="0"
                  required
                  autoFocus
                  value={newShiftInitialCash}
                  onChange={(e) => setNewShiftInitialCash(e.target.value)}
                  className="w-full text-2xl font-black font-mono py-2.5 pl-8 pr-3 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewShiftModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Abrir Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
