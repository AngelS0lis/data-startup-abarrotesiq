import { Product } from '../types';

export interface LowStockInfo {
  product: Product;
  currentStock: number;
  minThreshold: number;
  deficit: number;
  suggestedRestock: number;
  urgency: 'out_of_stock' | 'critical' | 'low';
}

/**
 * Returns the effective minimum threshold for a product.
 * Prefers product.minStock if defined and > 0, otherwise uses the store default threshold (default: 5).
 */
export function getProductMinThreshold(product: Product, defaultThreshold: number = 5): number {
  if (typeof product.minStock === 'number' && product.minStock > 0) {
    return product.minStock;
  }
  return defaultThreshold;
}

/**
 * Checks whether a product has fallen below or equal to its minimum configured threshold.
 */
export function isProductLowStock(product: Product, defaultThreshold: number = 5): boolean {
  const threshold = getProductMinThreshold(product, defaultThreshold);
  return product.stock <= threshold;
}

/**
 * Returns all products that are currently at or below their configured minimum threshold,
 * sorted by urgency (out-of-stock first, then lowest stock ratio).
 */
export function getLowStockProducts(
  products: Product[],
  defaultThreshold: number = 5
): LowStockInfo[] {
  const result: LowStockInfo[] = [];

  for (const product of products) {
    const threshold = getProductMinThreshold(product, defaultThreshold);
    if (product.stock <= threshold) {
      const deficit = Math.max(0, threshold - product.stock);
      // Suggested restock brings inventory up to at least 2.5x the threshold or a reasonable batch size
      const targetOptimal = Math.max(threshold * 2.5, threshold + 10);
      const suggestedRestock = Math.ceil(targetOptimal - product.stock);

      let urgency: 'out_of_stock' | 'critical' | 'low' = 'low';
      if (product.stock <= 0) {
        urgency = 'out_of_stock';
      } else if (product.stock <= threshold * 0.5) {
        urgency = 'critical';
      }

      result.push({
        product,
        currentStock: product.stock,
        minThreshold: threshold,
        deficit,
        suggestedRestock: suggestedRestock > 0 ? suggestedRestock : 10,
        urgency
      });
    }
  }

  // Sort: out_of_stock first, then critical, then lowest stock/threshold ratio
  return result.sort((a, b) => {
    const urgencyOrder = { out_of_stock: 0, critical: 1, low: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    const ratioA = a.currentStock / Math.max(1, a.minThreshold);
    const ratioB = b.currentStock / Math.max(1, b.minThreshold);
    return ratioA - ratioB;
  });
}
