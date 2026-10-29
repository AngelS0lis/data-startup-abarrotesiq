import React, { useState } from 'react';
import {
  BookUser,
  Plus,
  Search,
  DollarSign,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Receipt,
  FileText,
  Trash2,
  UserX
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Customer } from '../../types';

export const FiadosView: React.FC = () => {
  const { customers, addCustomer, deleteCustomer, addCustomerPayment } = usePOS();

  const [search, setSearch] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customers[0]?.id || null
  );

  // Delete customer modal
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // New customer modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [creditLimit, setCreditLimit] = useState<string>('1000');
  const [notes, setNotes] = useState<string>('');

  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('Abono a cuenta');

  // Metrics
  const totalReceivable = customers.reduce((sum, c) => sum + c.balance, 0);
  const customersWithDebt = customers.filter((c) => c.balance > 0).length;

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
  });

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      creditLimit: parseFloat(creditLimit) || 500,
      notes: notes.trim()
    });

    setIsNewCustomerModalOpen(false);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;

    addCustomerPayment(activeCustomer.id, amount, paymentNote);
    setIsPaymentModalOpen(false);
    setPaymentAmount('');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      {/* Top Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <BookUser className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total por Cobrar (Fiado)
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-700">
              ${totalReceivable.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Cuentas Pendientes
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600">
              {customersWithDebt} <span className="text-xs font-normal text-slate-400">clientes</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Libreta de Clientes
            </span>
            <span className="text-lg font-bold text-slate-900">
              {customers.length} Registrados
            </span>
          </div>
          <button
            type="button"
            id="btn-new-customer"
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Customer List & Detail Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Customer Directory (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[640px]">
          {/* Search Header */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search-customer-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente en la libreta..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Customer list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No se encontraron clientes en la libreta.
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = cust.id === selectedCustomerId;
                const creditUsagePct =
                  cust.creditLimit > 0
                    ? Math.min(100, (cust.balance / cust.creditLimit) * 100)
                    : 0;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/80 border border-amber-300 shadow-xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{cust.name}</h4>
                        {cust.phone && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cust.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span
                          className={`font-black font-mono text-sm sm:text-base ${
                            cust.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          ${cust.balance.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 block">
                            Límite: ${cust.creditLimit.toFixed(0)}
                          </span>
                          <button
                            type="button"
                            title="Eliminar de la libreta de fiados"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomerToDelete(cust);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Credit usage bar */}
                    {cust.creditLimit > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              creditUsagePct > 80
                                ? 'bg-rose-500'
                                : creditUsagePct > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${creditUsagePct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Customer Statement Sheet (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5 h-[640px] overflow-y-auto">
          {activeCustomer ? (
            <>
              {/* Customer Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900">{activeCustomer.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                        activeCustomer.balance > 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {activeCustomer.balance > 0 ? 'Con Adeudo' : 'Al Corriente'}
                    </span>
                    <button
                      type="button"
                      id="btn-eliminar-cliente-fiado"
                      onClick={() => {
                        setCustomerToDelete(activeCustomer);
                        setIsDeleteModalOpen(true);
                      }}
                      title="Eliminar a esta persona de la libreta de fiados"
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar de libreta</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    {activeCustomer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {activeCustomer.phone}
                      </span>
                    )}
                    {activeCustomer.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {activeCustomer.address}
                      </span>
                    )}
                  </div>
                  {activeCustomer.notes && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg mt-2 inline-block">
                      📝 {activeCustomer.notes}
                    </p>
                  )}
                </div>

                {/* Big Action: Registrar Abono */}
                <div className="text-right flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs uppercase font-bold text-slate-400">Saldo Deudor</span>
                  <span className="text-3xl font-black font-mono text-rose-600">
                    ${activeCustomer.balance.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    id="btn-registrar-abono"
                    disabled={activeCustomer.balance <= 0}
                    onClick={() => {
                      setPaymentAmount(activeCustomer.balance.toFixed(2));
                      setIsPaymentModalOpen(true);
                    }}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                      activeCustomer.balance <= 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Registrar Abono</span>
                  </button>
                </div>
              </div>

              {/* Transaction History in the Libreta */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Historial de Cargos y Abonos</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {activeCustomer.history.length} movimientos
                  </span>
                </div>

                {activeCustomer.history.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    No hay movimientos registrados para este cliente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeCustomer.history.map((mov) => {
                      const isCargo = mov.type === 'cargo';
                      return (
                        <div
                          key={mov.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                                  isCargo
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isCargo ? 'Cargo (Fiado)' : 'Abono'}
                              </span>
                              <span className="text-slate-400 text-[11px] font-mono">
                                {mov.date}
                              </span>
                              {mov.folio && (
                                <span className="text-slate-500 font-mono font-semibold">
                                  #{mov.folio}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 font-medium">{mov.note}</p>
                          </div>

                          <div className="text-right font-mono font-black text-sm">
                            <span className={isCargo ? 'text-rose-600' : 'text-emerald-700'}>
                              {isCargo ? '+' : '-'}${mov.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-center text-xs">
              Selecciona un cliente de la lista para ver su estado de cuenta.
            </div>
          )}
        </div>
      </div>

      {/* New Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div
              style={{ backgroundColor: 'var(--header-bg-color, #0f172a)' }}
              className="text-white px-5 py-4 flex items-center justify-between transition-colors duration-200"
            >
              <h3 className="font-extrabold text-base">Registrar Nuevo Cliente en Libreta</h3>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo / Apodo:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Don Chon (Puesto de jugos)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="55 0000 0000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Límite Crédito ($):
                  </label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="1000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ej. Casa amarilla portón negro"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas de cobranza / referencias:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ej. Paga quincenal, cliente muy recomendado..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment / Abono Modal */}
      {isPaymentModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div
              style={{ backgroundColor: 'var(--header-bg-color, #0f172a)' }}
              className="text-white px-5 py-4 flex items-center justify-between transition-colors duration-200"
            >
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                  Cobrar Abono
                </span>
                <h3 className="font-extrabold text-base">{activeCustomer.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Saldo total a liquidar:</span>
                <span className="text-base font-black font-mono text-rose-600">
                  ${activeCustomer.balance.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto del Abono ($ MXN):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max={activeCustomer.balance}
                    autoFocus
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full text-2xl font-black font-mono py-2.5 pl-8 pr-3 bg-white border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick payment options */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(activeCustomer.balance.toFixed(2))}
                  className="py-1.5 px-2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold"
                >
                  Liquidar Todo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAmount((activeCustomer.balance / 2).toFixed(2))}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold"
                >
                  La mitad (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAmount('100.00')}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold"
                >
                  $100.00
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nota / Observación:
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="ej. Abono en efectivo"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar Cobro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar cliente de la libreta */}
      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Eliminar de Libreta de Fiados</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCustomerToDelete(null);
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 text-sm">
                ¿Estás seguro de que deseas eliminar a{' '}
                <strong className="text-slate-900 font-bold">{customerToDelete.name}</strong> de la libreta de fiados?
              </p>

              {customerToDelete.balance > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Saldo deudor pendiente: ${customerToDelete.balance.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Esta persona aún tiene una cuenta por cobrar de <strong>${customerToDelete.balance.toFixed(2)}</strong>. Si la eliminas, ya no aparecerá en la libreta de fiados ni podrá seleccionarse al cobrar.
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-xs leading-relaxed">
                  Esta persona está al corriente (saldo $0.00). Al eliminarla, se removerá de la libreta y ya no aparecerá como opción de crédito en caja.
                </p>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCustomerToDelete(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirmar-eliminar-cliente"
                  onClick={() => {
                    deleteCustomer(customerToDelete.id);
                    if (selectedCustomerId === customerToDelete.id) {
                      const remaining = customers.filter((c) => c.id !== customerToDelete.id);
                      setSelectedCustomerId(remaining[0]?.id || null);
                    }
                    setIsDeleteModalOpen(false);
                    setCustomerToDelete(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
