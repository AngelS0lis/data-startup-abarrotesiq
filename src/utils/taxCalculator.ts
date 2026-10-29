import { Sale } from '../types';

export interface TaxBreakdown {
  // Items subject to standard 16% IVA
  taxableSubtotal: number;
  taxableBase: number;
  taxAmount16: number;

  // Items with 0% tax / exempt (alimentos básicos no procesados, frutas, verduras, tortillas, leche básica, huevo)
  exemptSubtotal: number;

  // Totals
  subtotal: number;
  discount: number;
  totalTax: number;
  total: number;

  hasTaxableItems: boolean;
  hasExemptItems: boolean;
}

/**
 * Categorizes product items according to Mexican retail grocery tax rules (SAT Ley del IVA).
 * Fresh vegetables, fruits, basic milk, tortillas, and bulk eggs are 0% tasa exenta.
 * Processed snacks, sodas, and cleaning goods are 16% IVA gravable.
 */
export function isItemTaxExempt(category: string, productName: string, isBulk?: boolean): boolean {
  if (category === 'frutas_verduras') return true;

  const lowerName = productName.toLowerCase();
  if (
    isBulk &&
    (lowerName.includes('huevo') ||
      lowerName.includes('tortilla') ||
      lowerName.includes('frijol') ||
      lowerName.includes('arroz') ||
      lowerName.includes('jitomate') ||
      lowerName.includes('cebolla') ||
      lowerName.includes('papa'))
  ) {
    return true;
  }

  if (lowerName.includes('leche ') || lowerName.startsWith('leche')) {
    return true;
  }
  if (lowerName.includes('huevo ') || lowerName.startsWith('huevo')) {
    return true;
  }
  if (lowerName.includes('tortilla')) {
    return true;
  }

  return false;
}

/**
 * Calculates a clean, accurate tax breakdown for thermal ticket printing.
 * In Mexican grocery retail, displayed prices already include IVA.
 */
export function calculateReceiptTaxes(sale: Sale): TaxBreakdown {
  let taxableGross = 0;
  let exemptGross = 0;

  for (const item of sale.items) {
    const isExempt = isItemTaxExempt(item.product.category, item.product.name, item.isBulk);
    if (isExempt) {
      exemptGross += item.total;
    } else {
      taxableGross += item.total;
    }
  }

  const discount = sale.discount || 0;
  const grossSum = taxableGross + exemptGross;

  let effTaxableGross = taxableGross;
  let effExemptGross = exemptGross;

  if (discount > 0 && grossSum > 0) {
    const discountRatio = (grossSum - discount) / grossSum;
    effTaxableGross = taxableGross * discountRatio;
    effExemptGross = exemptGross * discountRatio;
  }

  // Base = Gross / 1.16; IVA = Gross - Base
  const taxableBase = effTaxableGross > 0 ? effTaxableGross / 1.16 : 0;
  const taxAmount16 = effTaxableGross - taxableBase;

  return {
    taxableSubtotal: Number(effTaxableGross.toFixed(2)),
    taxableBase: Number(taxableBase.toFixed(2)),
    taxAmount16: Number(taxAmount16.toFixed(2)),
    exemptSubtotal: Number(effExemptGross.toFixed(2)),
    subtotal: sale.subtotal,
    discount: discount,
    totalTax: Number(taxAmount16.toFixed(2)),
    total: sale.total,
    hasTaxableItems: taxableGross > 0,
    hasExemptItems: exemptGross > 0
  };
}
