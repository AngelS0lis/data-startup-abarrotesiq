import React, { useState, useEffect } from 'react';
import {
  Banknote,
  CreditCard,
  QrCode,
  BookUser,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { PaymentMethod, Sale } from '../../types';
import { usePOS } from '../../context/POSContext';
import { soundEffects } from '../../utils/audio';

interface CheckoutModalProps {
  onClose: () => void;
  onSuccess: (sale: Sale) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onSuccess }) => {
  const { cartSubtotal, completeSale, customers, addCustomer, settings, cart } = usePOS();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');

  // High sale confirmation layer to prevent capture mistakes
  const [showHighSaleConfirmModal, setShowHighSaleConfirmModal] = useState<boolean>(false);

  const totalToPay = Math.max(0, cartSubtotal - discount);
  const amountPaidNum = parseFloat(amountPaidInput) || 0;
  const change = paymentMethod === 'efectivo' ? Math.max(0, amountPaidNum - totalToPay) : 0;
  const isInsufficientCash = paymentMethod === 'efectivo' && amountPaidNum < totalToPay;

  const isHighSale =
    (settings.requireHighSaleConfirmation ?? true) &&
    totalToPay >= (settings.highSaleThreshold ?? 1000);

  // Auto-fill exact amount on load or payment method change
  useEffect(() => {
    if (settings.kioskMode && paymentMethod === 'fiado') {
      setPaymentMethod('efectivo');
      return;
    }
    if (paymentMethod === 'efectivo') {
      // Don't auto-fill empty, let them press quick buttons or exact
    } else {
      setAmountPaidInput(totalToPay.toFixed(2));
    }
  }, [paymentMethod, totalToPay, settings.kioskMode]);

  // Selected customer info
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const executeSale = () => {
    const completed = completeSale({
      paymentMethod,
      amountPaid: paymentMethod === 'efectivo' ? amountPaidNum : totalToPay,
      customerId: paymentMethod === 'fiado' ? selectedCustomerId : undefined,
      discount
    });

    if (completed) {
      onSuccess(completed);
    }
  };

  const handleConfirm = () => {
    if (paymentMethod === 'efectivo' && isInsufficientCash) {
      return;
    }
    if (paymentMethod === 'fiado' && !selectedCustomerId) {
      return;
    }

    // Intercept if sale exceeds user-defined threshold and has not yet been confirmed
    if (isHighSale && !showHighSaleConfirmModal) {
      soundEffects.alert();
      setShowHighSaleConfirmModal(true);
      return;
    }

    executeSale();
  };

  // Keyboard shortcut: Enter to confirm if ready, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (showHighSaleConfirmModal) {
          e.preventDefault();
          executeSale();
        } else if (!isInsufficientCash) {
          if (paymentMethod === 'fiado' && !selectedCustomerId) return;
          e.preventDefault();
          handleConfirm();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (showHighSaleConfirmModal) {
          setShowHighSaleConfirmModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    amountPaidNum,
    totalToPay,
    paymentMethod,
    selectedCustomerId,
    isInsufficientCash,
    showHighSaleConfirmModal,
    isHighSale
  ]);

  const handleCreateExpressCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    addCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      creditLimit: 500
    });
    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowNewCustomerForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          style={{ backgroundColor: 'var(--header-bg-color, #0f172a)' }}
          className="text-white px-5 py-4 flex items-center justify-between transition-colors duration-200"
        >
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              Pagar Cuenta
            </span>
            <h2 className="text-xl font-extrabold text-white">Cobro de Venta</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Big Total Banner */}
          <div
            style={{ backgroundColor: 'var(--header-bg-color, #0f172a)' }}
            className="text-white rounded-xl p-4 flex items-center justify-between shadow-inner transition-colors duration-200"
          >
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase">
                Total a Cobrar
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight">
                ${totalToPay.toFixed(2)}
              </span>
            </div>
            {discount > 0 && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-md">
                Desc. -${discount.toFixed(2)}
              </span>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 mb-0 uppercase tracking-wider">
                Forma de Pago:
              </label>
              {settings.kioskMode && (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                  Modo Kiosco: Cobro Directo
                </span>
              )}
            </div>
            <div className={`grid ${settings.kioskMode ? 'grid-cols-3' : 'grid-cols-4'} gap-1.5 bg-slate-100 p-1.5 rounded-xl`}>
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                  paymentMethod === 'efectivo'
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('tarjeta')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-blue-600" />
                <span>Tarjeta</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                  paymentMethod === 'transferencia'
                    ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1 text-purple-600" />
                <span>Transf. / CoDi</span>
              </button>

              {!settings.kioskMode && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('fiado')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                    paymentMethod === 'fiado'
                      ? 'bg-white text-amber-800 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookUser className="w-5 h-5 mb-1 text-amber-600" />
                  <span>Fiado</span>
                </button>
              )}
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'efectivo' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto Recibido del Cliente ($):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    autoFocus
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="w-full text-2xl sm:text-3xl font-black font-mono py-2.5 pl-10 pr-4 bg-slate-50 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-hidden text-slate-900"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Fast Bill Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500">
                  Billetes / Monedas rápidos:
                </span>
                <div className="grid grid-cols-6 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmountPaidInput(totalToPay.toFixed(2))}
                    className="py-2 px-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 transition-colors"
                  >
                    Exacto
                  </button>
                  {[20, 50, 100, 200, 500].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setAmountPaidInput(bill.toString())}
                      className="py-2 px-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 hover:border-slate-300 transition-colors font-mono"
                    >
                      ${bill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Box */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isInsufficientCash
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isInsufficientCash ? (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  <span className="font-bold text-sm">
                    {isInsufficientCash ? 'Faltan:' : 'Cambio a devolver:'}
                  </span>
                </div>
                <span className="text-2xl font-black font-mono">
                  ${isInsufficientCash ? (totalToPay - amountPaidNum).toFixed(2) : change.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Fiado (Customer credit) Section */}
          {paymentMethod === 'fiado' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Seleccionar Cliente de la Libreta:
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showNewCustomerForm ? 'Cancelar' : 'Registrar Nuevo Cliente'}
                </button>
              </div>

              {showNewCustomerForm ? (
                <form
                  onSubmit={handleCreateExpressCustomer}
                  className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-2"
                >
                  <span className="text-xs font-bold text-amber-900 block">
                    Alta Rápida de Cliente Fiado
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo o apodo (ej. Doña Lupe)"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono / Celular (opcional)"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                  >
                    Guardar y Seleccionar
                  </button>
                </form>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-semibold focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="">-- Elige un cliente para cargar la cuenta --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Saldo pendiente: ${c.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              )}

              {selectedCustomer && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1 text-amber-900">
                  <div className="flex justify-between font-medium">
                    <span>Deuda anterior:</span>
                    <span className="font-mono font-bold">${selectedCustomer.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Monto de esta compra:</span>
                    <span className="font-mono font-bold text-rose-600">+${totalToPay.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-amber-200 pt-1 flex justify-between font-bold text-sm">
                    <span>Nuevo saldo pendiente:</span>
                    <span className="font-mono text-rose-700">
                      ${(selectedCustomer.balance + totalToPay).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Electronic payment info */}
          {(paymentMethod === 'tarjeta' || paymentMethod === 'transferencia') && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center space-y-2">
              <p className="text-xs text-slate-600 font-medium">
                {paymentMethod === 'tarjeta'
                  ? 'Pasa la tarjeta en la terminal bancaria (Clip, Mercado Pago, Banco).'
                  : 'Verifica la recepción de la transferencia o pago CoDi en tu celular antes de confirmar.'}
              </p>
              <div className="text-xl font-bold font-mono text-slate-800">
                Importe: ${totalToPay.toFixed(2)}
              </div>
            </div>
          )}

          {/* High Sale Alert Warning Banner */}
          {isHighSale && (
            <div className="flex items-center gap-2.5 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex-1">
                <span className="font-bold block">
                  Venta de monto elevado (&gt; ${(settings.highSaleThreshold ?? 1000).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN)
                </span>
                <span className="text-[11px] text-amber-700">
                  Se abrirá una ventana de confirmación antes de registrar el cobro.
                </span>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              type="button"
              id="btn-checkout-confirm-pay"
              disabled={isInsufficientCash || (paymentMethod === 'fiado' && !selectedCustomerId)}
              onClick={handleConfirm}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                isInsufficientCash || (paymentMethod === 'fiado' && !selectedCustomerId)
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : isHighSale
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {isHighSale ? 'VALIDAR Y COBRAR (Enter)' : 'CONFIRMAR COBRO (Enter)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* High Sale Confirmation Alert Dialog */}
      {showHighSaleConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header / Title */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-7 h-7 animate-pulse" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md inline-block mb-1">
                  Prevención de Error de Captura
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  ¿Confirmar venta de monto elevado?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  El total supera el límite de seguridad de{' '}
                  <strong className="text-slate-800 font-mono">
                    ${(settings.highSaleThreshold ?? 1000).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </strong>
                  . Por favor verifica que los artículos y precios sean correctos antes de emitir el ticket.
                </p>
              </div>
            </div>

            {/* Ticket Breakdown Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-600 font-medium">Total a cobrar:</span>
                <span className="text-2xl font-black font-mono text-emerald-700">
                  ${totalToPay.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Método de pago:</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {paymentMethod === 'efectivo'
                      ? 'Efectivo'
                      : paymentMethod === 'tarjeta'
                      ? 'Tarjeta bancaria'
                      : paymentMethod === 'transferencia'
                      ? 'Transferencia / SPEI'
                      : 'Fiado a cuenta'}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">
                    {paymentMethod === 'efectivo' ? 'Cambio a entregar:' : 'Cliente:'}
                  </span>
                  <span className="font-bold font-mono text-slate-800">
                    {paymentMethod === 'efectivo'
                      ? `$${change.toFixed(2)} MXN`
                      : selectedCustomer?.name || 'Cliente de mostrador'}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Artículos en este ticket ({cart.length}):
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 text-xs divide-y divide-slate-100 pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        {item.product.image ? (
                          <img src={item.product.image} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                        ) : (
                          <span className="text-sm shrink-0">{item.product.emoji || '📦'}</span>
                        )}
                        <span className="truncate font-medium">
                          {item.quantity} {item.product.unit} × {item.product.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 shrink-0">
                        ${item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirmation Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                id="high-sale-btn-cancel"
                onClick={() => setShowHighSaleConfirmModal(false)}
                className="py-2.5 px-3 rounded-xl border-2 border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Revisar Ticket (Esc)</span>
              </button>

              <button
                type="button"
                id="high-sale-btn-confirm"
                onClick={executeSale}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sí, Confirmar Cobro (Enter)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
