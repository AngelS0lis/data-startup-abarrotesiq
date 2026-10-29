export type ProductCategory =
  | 'lacteos'
  | 'bebidas'
  | 'botanas'
  | 'despensa'
  | 'frutas_verduras'
  | 'panaderia'
  | 'limpieza'
  | 'varios';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  icon: string;
  badgeClass: string;
}

export interface Product {
  id: string;
  code: string; // Barcode or shortcut
  name: string;
  category: ProductCategory;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: 'pza' | 'kg' | 'paq' | 'litro';
  isBulk?: boolean; // Venta a granel / peso
  emoji?: string;
  image?: string; // URL o Data URL (base64) de la imagen del producto
  isQuickAccess?: boolean; // Botonera rápida de mostrador
}

export interface CartItem {
  id: string; // Unique row id in cart
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
  isBulk?: boolean;
  bulkAmountInPesos?: number;
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'fiado';

export interface Sale {
  id: string;
  folio: number;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  customerId?: string;
  customerName?: string;
  cashier: string;
  syncedToSheets?: boolean;
  offlineRecorded?: boolean;
  syncedAt?: string;
}

export interface OfflineSyncItem {
  id: string;
  sale: Sale;
  queuedAt: string;
  attempts: number;
  lastAttemptAt?: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  errorMessage?: string;
}

export interface SyncStatusInfo {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime?: string;
  lastError?: string;
}

export interface CustomerDebtMovement {
  id: string;
  date: string;
  type: 'cargo' | 'abono';
  amount: number;
  note: string;
  folio?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  balance: number; // Saldo deudor pendiente
  creditLimit: number;
  history: CustomerDebtMovement[];
}

export interface CashMovement {
  id: string;
  time: string;
  type: 'entrada' | 'salida';
  amount: number;
  reason: string;
}

export interface CashShift {
  id: string;
  openedAt: string;
  initialCash: number;
  movements: CashMovement[];
  status: 'open' | 'closed';
  closedAt?: string;
  countedCash?: number;
}

export interface StoreSettings {
  storeName: string;
  storeSlogan: string;
  phone: string;
  address: string;
  ticketFooter: string;
  soundEnabled: boolean;
  autoPrintReceipt?: boolean;
  ticketPaperWidth?: '80mm' | '58mm';
  showBarcodeOnTicket?: boolean;
  showQrOnTicket?: boolean;
  contactUrl?: string;
  requireHighSaleConfirmation?: boolean;
  highSaleThreshold?: number;
  lowStockAlertEnabled?: boolean;
  defaultMinStockThreshold?: number;
  theme?: 'light' | 'dark';
  primaryColor?: string;
  headerBgColor?: string;
  highContrast?: boolean;
  kioskMode?: boolean;
  kioskPin?: string;
}

export type POSTab = 'pos' | 'dashboard' | 'inventario' | 'fiados' | 'corte' | 'historial';

export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  pin: string; // PIN numérico (ej. 1234) o clave de acceso
  emoji?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}
