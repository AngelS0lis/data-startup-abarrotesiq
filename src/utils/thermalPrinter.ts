import { Sale, StoreSettings } from '../types';
import { calculateReceiptTaxes } from './taxCalculator';

/**
 * Utility to pad and align text for monospace thermal printers
 */
function padLeft(text: string, length: number): string {
  if (text.length >= length) return text.substring(0, length);
  return ' '.repeat(length - text.length) + text;
}

function padRight(text: string, length: number): string {
  if (text.length >= length) return text.substring(0, length);
  return text + ' '.repeat(length - text.length);
}

function centerText(text: string, width: number): string {
  if (text.length >= width) return text.substring(0, width);
  const leftPadding = Math.floor((width - text.length) / 2);
  const rightPadding = width - text.length - leftPadding;
  return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
}

/**
 * Generates formatted plain text for 80mm thermal receipt printers (standard 42-48 columns)
 * Perfect for ESC/POS, Bluetooth thermal printers, or sending via WhatsApp.
 */
export function generateAsciiThermalTicket(
  sale: Sale,
  settings: StoreSettings,
  columns: number = 42
): string {
  const line = '='.repeat(columns);
  const dashLine = '-'.repeat(columns);
  const lines: string[] = [];

  // Header
  lines.push(centerText(settings.storeName.toUpperCase(), columns));
  if (settings.storeSlogan) {
    lines.push(centerText(settings.storeSlogan, columns));
  }
  if (settings.address) {
    lines.push(centerText(settings.address, columns));
  }
  if (settings.phone) {
    lines.push(centerText(`TEL: ${settings.phone}`, columns));
  }
  lines.push(line);

  // Metadata
  lines.push(`FOLIO: #${sale.folio.toString().padStart(5, '0')}   FECHA: ${sale.date}`);
  lines.push(`CAJERO: ${sale.cashier.toUpperCase()}`);
  if (sale.customerName) {
    lines.push(`CLIENTE (CUENTA FIADA): ${sale.customerName.toUpperCase()}`);
  }
  lines.push(dashLine);

  // Column titles
  // Format: CANT  DESCRIPCION            PRECIO    TOTAL
  // e.g.    1.5kg Huevo Blanco            48.00    72.00
  lines.push(
    padRight('CANT', 6) +
      padRight('ARTICULO', columns - 6 - 9 - 9) +
      padLeft('PRECIO', 8) +
      ' ' +
      padLeft('TOTAL', 8)
  );
  lines.push(dashLine);

  // Items
  sale.items.forEach((item) => {
    const qtyStr = `${item.quantity}${item.product.unit === 'kg' ? 'kg' : ''}`;
    const nameStr = item.product.name;
    const priceStr = `$${item.unitPrice.toFixed(2)}`;
    const totalStr = `$${item.total.toFixed(2)}`;

    const maxNameLen = columns - 6 - 9 - 9;
    const truncatedName =
      nameStr.length > maxNameLen ? nameStr.substring(0, maxNameLen - 1) + '.' : nameStr;

    lines.push(
      padRight(qtyStr, 6) +
        padRight(truncatedName, maxNameLen) +
        padLeft(priceStr, 8) +
        ' ' +
        padLeft(totalStr, 8)
    );
  });

  lines.push(dashLine);

  // Taxes Breakdown (IVA)
  const taxes = calculateReceiptTaxes(sale);
  lines.push(centerText('DESGLOSE DE IMPUESTOS (IVA)', columns));
  if (taxes.hasTaxableItems) {
    lines.push(
      padRight('  BASE GRAVABLE (16%):', columns - 12) +
        padLeft(`$${taxes.taxableBase.toFixed(2)}`, 12)
    );
    lines.push(
      padRight('  IVA 16% TRASLADADO:', columns - 12) +
        padLeft(`$${taxes.taxAmount16.toFixed(2)}`, 12)
    );
  }
  if (taxes.hasExemptItems) {
    lines.push(
      padRight('  TASA 0% (ALIMENTOS):', columns - 12) +
        padLeft(`$${taxes.exemptSubtotal.toFixed(2)}`, 12)
    );
  }
  lines.push(
    padRight('  TOTAL IMPUESTOS:', columns - 12) +
      padLeft(`$${taxes.totalTax.toFixed(2)}`, 12)
  );
  lines.push(centerText('* Precios con IVA incluido *', columns));
  lines.push(dashLine);

  // Totals Breakdown
  const totalQty = sale.items.reduce((acc, i) => acc + i.quantity, 0);
  lines.push(
    padRight(`NUM. ARTICULOS: ${totalQty}`, columns - 18) +
      padLeft(`SUBTOTAL:`, 9) +
      padLeft(`$${sale.subtotal.toFixed(2)}`, 9)
  );

  if (sale.discount > 0) {
    lines.push(
      padRight('', columns - 18) +
        padLeft(`DESCUENTO:`, 10) +
        padLeft(`-$${sale.discount.toFixed(2)}`, 8)
    );
  }

  lines.push(
    padRight('TOTAL A PAGAR:', columns - 15) +
      padLeft(`$${sale.total.toFixed(2)}`, 15)
  );

  lines.push(dashLine);

  // Payment method
  lines.push(`FORMA DE PAGO: ${sale.paymentMethod.toUpperCase()}`);
  if (sale.paymentMethod === 'efectivo') {
    lines.push(
      padRight(`RECIBIDO: $${sale.amountPaid.toFixed(2)}`, columns - 18) +
        padLeft(`CAMBIO: $${sale.change.toFixed(2)}`, 18)
    );
  }

  lines.push(line);

  // Barcode / Verification text
  lines.push(centerText(`*TK-${sale.folio.toString().padStart(6, '0')}*`, columns));
  lines.push(centerText(`NO. TICKET: ${sale.folio}`, columns));
  lines.push('');

  // Store Contact QR / Web link
  const contactLink = settings.contactUrl || (settings.phone ? `wa.me/52${settings.phone.replace(/\D/g, '')}` : '');
  if (contactLink) {
    lines.push(centerText('[CODIGO QR DE CONTACTO]', columns));
    lines.push(centerText('ATENCION Y PEDIDOS POR WHATSAPP:', columns));
    lines.push(centerText(contactLink, columns));
    lines.push('');
  }

  // Footer message
  if (settings.ticketFooter) {
    lines.push(centerText(settings.ticketFooter, columns));
  }
  lines.push(centerText('*** GRACIAS POR SU COMPRA ***', columns));
  lines.push(centerText('*** CONSERVE ESTE COMPROBANTE ***', columns));
  lines.push('');
  lines.push(centerText('- - - - CORTE DE TICKET - - - -', columns));

  return lines.join('\n');
}

/**
 * Triggers native 80mm thermal browser print
 */
export function print80mmThermalReceipt(): void {
  // Small timeout to allow DOM to be fully painted
  setTimeout(() => {
    window.print();
  }, 100);
}
