import React, { useEffect, useState, useRef } from 'react';
import {
  Printer,
  Check,
  X,
  ArrowRight,
  Copy,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Sale } from '../../types';
import { usePOS } from '../../context/POSContext';
import { ThermalBarcode } from './ThermalBarcode';
import { ThermalQRCode } from './ThermalQRCode';
import { generateAsciiThermalTicket } from '../../utils/thermalPrinter';
import { calculateReceiptTaxes } from '../../utils/taxCalculator';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { settings, updateSettings } = usePOS();
  const [copied, setCopied] = useState<boolean>(false);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(
    settings.ticketPaperWidth || '80mm'
  );
  const [autoPrint, setAutoPrint] = useState<boolean>(
    settings.autoPrintReceipt ?? true
  );

  const hasAutoPrintedRef = useRef<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  // Auto-print effect when modal mounts
  useEffect(() => {
    if (autoPrint && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'p' || e.key === 'P' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleCopyText();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyText = () => {
    const asciiText = generateAsciiThermalTicket(
      sale,
      settings,
      paperWidth === '80mm' ? 42 : 32
    );
    navigator.clipboard.writeText(asciiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAutoPrint = () => {
    const nextVal = !autoPrint;
    setAutoPrint(nextVal);
    updateSettings({ ...settings, autoPrintReceipt: nextVal });
  };

  const handleWidthChange = (width: '80mm' | '58mm') => {
    setPaperWidth(width);
    updateSettings({ ...settings, ticketPaperWidth: width });
  };

  const totalItemCount = sale.items.reduce((acc, i) => acc + i.quantity, 0);
  const taxes = calculateReceiptTaxes(sale);

  // Store contact link formatted for QR code
  const contactUrl =
    settings.contactUrl?.trim() ||
    (() => {
      const cleanPhone = (settings.phone || '').replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const waNumber = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
        return `https://wa.me/${waNumber}?text=${encodeURIComponent(
          `Hola ${settings.storeName}, me comunico con respecto a mi ticket de compra #${sale.folio}.`
        )}`;
      }
      return `https://wa.me/?text=${encodeURIComponent(`Ticket #${sale.folio} - ${settings.storeName}`)}`;
    })();

  const displayContactText = settings.phone
    ? `WhatsApp / Tel: ${settings.phone}`
    : settings.contactUrl || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top bar with quick actions */}
        <div
          style={{ backgroundColor: 'var(--header-bg-color, #0f172a)' }}
          className="text-white px-4 py-3 flex items-center justify-between shrink-0 transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <div className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                <span>Venta Finalizada</span>
                <span className="text-emerald-400">#{sale.folio}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Ticket Térmico Formateado {paperWidth}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              title="Cerrar y pasar a la siguiente venta (Esc)"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="bg-slate-800 px-4 py-2 text-white text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 shrink-0">
          {/* Paper format selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Ancho:</span>
            <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => handleWidthChange('80mm')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                  paperWidth === '80mm'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm (Estándar)
              </button>
              <button
                type="button"
                onClick={() => handleWidthChange('58mm')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                  paperWidth === '58mm'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm (Mini)
              </button>
            </div>
          </div>

          {/* Auto print toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={toggleAutoPrint}
              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
            />
            <span>Auto-imprimir</span>
          </label>
        </div>

        {/* Printable Ticket Receipt Container */}
        <div className="overflow-y-auto p-3 sm:p-5 bg-slate-200/80 flex-1 flex justify-center items-start">
          {/* The Thermal Paper Replica */}
          <div
            id="printable-ticket"
            className={`bg-white text-black p-4 shadow-md border border-slate-300 w-full ${
              paperWidth === '80mm' ? 'max-w-[320px] ticket-80mm' : 'max-w-[260px] ticket-58mm'
            } text-[11px] font-mono leading-tight select-text`}
            style={{
              fontFamily: '"JetBrains Mono", "Courier New", Courier, monospace'
            }}
          >
            {/* Paper Tear / Cut Header Accent in Preview */}
            <div className="no-print text-center text-[9px] text-slate-400 pb-1 mb-2 border-b border-dotted border-slate-300 flex items-center justify-center gap-1">
              <span>✄</span>
              <span>- - - - - - - - - - - - - - - - - - - -</span>
            </div>

            {/* Store Header */}
            <div className="ticket-header-box text-center space-y-0.5 pb-2 border-b border-dashed border-black">
              <h1 className="font-extrabold text-sm uppercase tracking-wide leading-tight">
                {settings.storeName}
              </h1>
              {settings.storeSlogan && (
                <p className="text-[10px] uppercase">{settings.storeSlogan}</p>
              )}
              {settings.address && (
                <p className="text-[10px]">{settings.address}</p>
              )}
              {settings.phone && (
                <p className="text-[10px] font-bold">Tel: {settings.phone}</p>
              )}
            </div>

            {/* Sale metadata */}
            <div className="py-2 space-y-1 text-[10.5px] border-b border-dashed border-black">
              <div className="flex justify-between font-bold">
                <span>FOLIO TICKET:</span>
                <span>#{sale.folio.toString().padStart(5, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span>FECHA: {sale.date.split(' ')[0] || sale.date}</span>
                <span>HORA: {sale.date.split(' ')[1] || ''}</span>
              </div>
              <div className="flex justify-between">
                <span>CAJERO:</span>
                <span className="uppercase">{sale.cashier}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between font-bold border-t border-dotted border-black pt-1 mt-1">
                  <span>CUENTA FIADA:</span>
                  <span className="uppercase">{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Column Headers */}
            <div className="py-1.5 border-b border-dashed border-black text-[10px] font-bold">
              <div className="flex justify-between">
                <span className="w-12">CANT</span>
                <span className="flex-1 px-1">DESCRIPCIÓN</span>
                <span className="w-14 text-right">P.U.</span>
                <span className="w-14 text-right">TOTAL</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 space-y-2 border-b border-dashed border-black">
              {sale.items.map((item, idx) => (
                <div key={idx} className="ticket-item-row space-y-0.5">
                  <div className="flex justify-between items-start">
                    <span className="w-12 font-bold shrink-0">
                      {item.quantity}
                      {item.product.unit === 'kg' ? 'kg' : ''}
                    </span>
                    <span className="flex-1 px-1 font-bold leading-tight break-words">
                      {item.product.name}
                    </span>
                    <span className="w-14 text-right shrink-0">
                      ${item.unitPrice.toFixed(2)}
                    </span>
                    <span className="w-14 text-right font-bold shrink-0">
                      ${item.total.toFixed(2)}
                    </span>
                  </div>
                  {item.isBulk && (
                    <div className="text-[9.5px] text-slate-700 pl-12 italic">
                      * Granel: {item.quantity} kg x ${item.unitPrice.toFixed(2)}
                      /kg
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desglose de Impuestos (IVA) */}
            <div className="ticket-tax-breakdown py-2 border-b border-dashed border-black space-y-1">
              <div className="ticket-tax-title text-center font-extrabold text-[10px] uppercase tracking-wider pb-1 border-b border-dotted border-black">
                DESGLOSE DE IMPUESTOS (IVA)
              </div>
              <table className="ticket-tax-table w-full text-[9.5px]">
                <thead>
                  <tr className="border-b border-dotted border-black text-[8.5px]">
                    <th className="text-left font-bold pb-0.5">TASA / CONCEPTO</th>
                    <th className="text-right font-bold pb-0.5">BASE</th>
                    <th className="text-right font-bold pb-0.5">IVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-black/20">
                  {taxes.hasTaxableItems && (
                    <tr>
                      <td className="text-left py-0.5">
                        <span className="ticket-tax-badge font-bold border border-black px-1 mr-1 text-[8px]">
                          16%
                        </span>
                        Gravable (16%)
                      </td>
                      <td className="text-right py-0.5">
                        ${taxes.taxableBase.toFixed(2)}
                      </td>
                      <td className="text-right py-0.5 font-bold">
                        ${taxes.taxAmount16.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {taxes.hasExemptItems && (
                    <tr>
                      <td className="text-left py-0.5">
                        <span className="ticket-tax-badge font-bold border border-black px-1 mr-1 text-[8px]">
                          0%
                        </span>
                        Alimentos (0%)
                      </td>
                      <td className="text-right py-0.5">
                        ${taxes.exemptSubtotal.toFixed(2)}
                      </td>
                      <td className="text-right py-0.5 font-bold">$0.00</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="ticket-tax-total-row border-t border-dotted border-black font-bold text-[10px]">
                    <td colSpan={2} className="text-left pt-1 uppercase">
                      TOTAL IVA TRASLADADO:
                    </td>
                    <td className="text-right pt-1">${taxes.totalTax.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="text-[8.5px] text-center text-slate-600 print:text-black italic pt-0.5">
                * Precios mostrados con IVA incluido
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="ticket-totals-box py-2 space-y-1 text-[11px] border-b border-dashed border-black">
              <div className="flex justify-between">
                <span>ARTÍCULOS VENDIDOS:</span>
                <span className="font-bold">
                  {totalItemCount} {totalItemCount === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>${sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between font-bold">
                  <span>DESCUENTO:</span>
                  <span>-${sale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-double border-black mt-1">
                <span>TOTAL A PAGAR:</span>
                <span>${sale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method details */}
            <div className="ticket-payment-box py-2 space-y-1 text-[10.5px] border-b border-dashed border-black">
              <div className="flex justify-between uppercase">
                <span>FORMA DE PAGO:</span>
                <span className="font-bold">{sale.paymentMethod}</span>
              </div>
              {sale.paymentMethod === 'efectivo' && (
                <>
                  <div className="flex justify-between">
                    <span>PAGO CON:</span>
                    <span>${sale.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-0.5">
                    <span>SU CAMBIO:</span>
                    <span>${sale.change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Barcode & Verification */}
            {(settings.showBarcodeOnTicket ?? true) && (
              <div className="ticket-barcode-box py-2.5 text-center border-b border-dashed border-black flex flex-col items-center">
                <ThermalBarcode
                  value={`TK${sale.folio.toString().padStart(5, '0')}`}
                />
              </div>
            )}

            {/* Código QR al final del ticket con el link de contacto de la tienda */}
            {(settings.showQrOnTicket ?? true) && (
              <div className="ticket-qr-section py-2.5 text-center border-b border-dashed border-black flex flex-col items-center">
                <ThermalQRCode
                  value={contactUrl}
                  size={paperWidth === '80mm' ? 110 : 88}
                  label="ESCANEA PARA ATENCIÓN O PEDIDOS"
                  sublabel={displayContactText}
                />
              </div>
            )}

            {/* Footer Message */}
            <div className="ticket-footer-box pt-2.5 text-center text-[10px] space-y-1 leading-snug">
              {settings.ticketFooter && (
                <p className="font-bold">{settings.ticketFooter}</p>
              )}
              <p className="text-[9px] uppercase tracking-wider">
                *** CONSERVE SU COMPROBANTE ***
              </p>
              <p className="text-[9px] text-slate-600">
                Punto de Venta Abarrotes v1.0
              </p>
            </div>

            {/* Tear line in preview */}
            <div className="no-print text-center text-[9px] text-slate-400 pt-3 border-t border-dotted border-slate-300 mt-2 flex items-center justify-center gap-1">
              <span>- - - - - CORTE DE TICKET ({paperWidth.toUpperCase()}) - - - - -</span>
            </div>
          </div>
        </div>

        {/* Action buttons toolbar */}
        <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0">
          <div className="flex gap-2">
            {/* Primary Print Button */}
            <button
              type="button"
              id="btn-print-receipt"
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
              title="Enviar a impresora térmica (Enter o P)"
            >
              <Printer className="w-5 h-5 text-emerald-400" />
              <span>Imprimir Ticket (80mm)</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-800 text-[10px] font-mono rounded text-slate-300 border border-slate-700 ml-1">
                Enter
              </kbd>
            </button>

            {/* Next Sale Button */}
            <button
              type="button"
              id="btn-next-sale"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer shrink-0"
              title="Pasar a cobrar a la siguiente persona (Esc)"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Siguiente Venta</span>
              <span className="sm:hidden">Siguiente</span>
              <ArrowRight className="w-4 h-4 opacity-80" />
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-emerald-700 text-[10px] font-mono rounded text-emerald-100 ml-1">
                Esc
              </kbd>
            </button>
          </div>

          {/* Secondary Actions: Copy text or WhatsApp */}
          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <button
              type="button"
              id="btn-copy-ticket-text"
              onClick={handleCopyText}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="Copiar texto plano formateado a 42 columnas (C)"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">
                    ¡Ticket copiado al portapapeles!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Ticket en Texto (WhatsApp / ESC-POS)</span>
                  <kbd className="text-[9px] bg-slate-100 border border-slate-300 px-1 py-0.5 rounded text-slate-500 font-mono">
                    C
                  </kbd>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Listo para impresora térmica
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
