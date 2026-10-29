import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CartItem,
  CashMovement,
  CashShift,
  Customer,
  PaymentMethod,
  POSTab,
  Product,
  Sale,
  StoreSettings,
  OfflineSyncItem,
  User
} from '../types';
import {
  INITIAL_CASH_SHIFT,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SETTINGS,
  INITIAL_USERS
} from '../data/initialData';
import { soundEffects } from '../utils/audio';
import { applyThemeColor, getInitialThemeColor, applyHeaderColor, getInitialHeaderColor } from '../utils/themeColors';
import {
  enqueueOfflineSale,
  getPendingOfflineSales,
  getAllOfflineSales,
  markOfflineSalesSyncedBatch,
  markOfflineSaleFailed,
  clearSyncedOfflineSales,
  clearAllOfflineSales
} from '../services/offlineSyncService';
import { appendSalesToSheet } from '../services/googleSheets';
import { getAccessToken } from '../services/googleAuth';

interface CompleteSaleParams {
  paymentMethod: PaymentMethod;
  amountPaid: number;
  customerId?: string;
  cashier?: string;
  discount?: number;
}

interface POSContextType {
  // State
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  cart: CartItem[];
  sales: Sale[];
  customers: Customer[];
  cashShift: CashShift;
  settings: StoreSettings;
  activeTab: POSTab;
  setActiveTab: (tab: POSTab) => void;

  // Cart operations
  addToCart: (product: Product, quantity?: number, isBulk?: boolean, bulkAmountInPesos?: number) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTotalCount: number;

  // Sale completion
  completeSale: (params: CompleteSaleParams) => Sale | null;
  cancelSale: (saleId: string) => void;
  resetSales: (options?: { restoreStock?: boolean; resetShiftSales?: boolean }) => void;

  // Inventory operations
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, quantityToAdd: number) => void;
  resetAllData: () => void;

  // Customer / Fiado operations
  addCustomer: (customer: Omit<Customer, 'id' | 'balance' | 'history'>) => void;
  deleteCustomer: (customerId: string) => void;
  addCustomerPayment: (customerId: string, amount: number, note: string) => void;

  // Cash Shift operations
  addCashMovement: (type: 'entrada' | 'salida', amount: number, reason: string) => void;
  closeShift: (countedCash: number) => void;
  startNewShift: (initialCash: number) => void;

  // Settings
  updateSettings: (newSettings: StoreSettings) => void;

  // Theme, Color & High Contrast
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  headerBgColor: string;
  setHeaderBgColor: (color: string) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;

  // Kiosk Mode
  setKioskMode: (enabled: boolean) => void;

  // Offline sync & Google Sheets status
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncingSheets: boolean;
  lastSyncMessage: string | null;
  syncPendingOfflineSales: () => Promise<{ success: boolean; count: number; message: string }>;
  offlineQueueItems: OfflineSyncItem[];
  refreshOfflineQueue: () => Promise<void>;
  clearSyncedOfflineQueue: () => Promise<void>;

  // User Authentication & Session
  currentUser: User | null;
  users: User[];
  login: (usernameOrId: string, pin: string) => { success: boolean; error?: string };
  register: (data: {
    username: string;
    name: string;
    role: 'admin' | 'cashier';
    pin: string;
    emoji?: string;
    phone?: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (userId: string, pin: string) => { success: boolean; error?: string };
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => { success: boolean; error?: string };
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register' | 'switch' | 'manage';
  setAuthModalMode: (mode: 'login' | 'register' | 'switch' | 'manage') => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'pos_abarrotes_products_v1',
  SALES: 'pos_abarrotes_sales_v1',
  CUSTOMERS: 'pos_abarrotes_customers_v1',
  SHIFT: 'pos_abarrotes_shift_v1',
  SETTINGS: 'pos_abarrotes_settings_v1',
  USERS: 'pos_abarrotes_users_v1',
  SESSION: 'pos_abarrotes_session_v1'
};

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<POSTab>('pos');

  // Load state with fallback to initial data
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) {
        const parsed: Sale[] = JSON.parse(saved);
        // If there were only the original 2 test sales, upgrade to INITIAL_SALES with 7 days history
        if (parsed.length <= 2) {
          return INITIAL_SALES;
        }
        return parsed;
      }
      return INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [cashShift, setCashShift] = useState<CashShift>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFT);
      return saved ? JSON.parse(saved) : INITIAL_CASH_SHIFT;
    } catch {
      return INITIAL_CASH_SHIFT;
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Users & Authentication session state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (savedSession) {
        return JSON.parse(savedSession);
      }
      return INITIAL_USERS[0] || null;
    } catch {
      return INITIAL_USERS[0] || null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'switch' | 'manage'>('login');

  // Sync users to storage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (err) {
      console.error('Error al persistir usuarios:', err);
    }
  }, [users]);

  // Theme & High Contrast state (persisted in localStorage)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('pos_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    } catch {
      return 'light';
    }
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pos_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  // Apply and persist dark mode class
  useEffect(() => {
    try {
      localStorage.setItem('pos_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Error al persistir tema:', err);
    }
  }, [theme]);

  // Apply and persist high-contrast mode class
  useEffect(() => {
    try {
      localStorage.setItem('pos_high_contrast', highContrast ? 'true' : 'false');
      if (highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    } catch (err) {
      console.error('Error al persistir alto contraste:', err);
    }
  }, [highContrast]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      setSettings((s) => ({ ...s, theme: next }));
      return next;
    });
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    setSettings((s) => ({ ...s, theme: newTheme }));
  };

  const toggleHighContrast = () => {
    setHighContrastState((prev) => {
      const next = !prev;
      setSettings((s) => ({ ...s, highContrast: next }));
      return next;
    });
  };

  // Primary color state (persisted in localStorage & settings)
  const [primaryColor, setPrimaryColorState] = useState<string>(() => {
    try {
      if (settings?.primaryColor) return settings.primaryColor;
      return getInitialThemeColor();
    } catch {
      return 'emerald';
    }
  });

  // Apply theme color whenever primaryColor changes
  useEffect(() => {
    applyThemeColor(primaryColor);
  }, [primaryColor]);

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    applyThemeColor(color);
    setSettings((s) => ({ ...s, primaryColor: color }));
  };

  // Header background color state (persisted in localStorage & settings)
  const [headerBgColor, setHeaderBgColorState] = useState<string>(() => {
    try {
      if (settings?.headerBgColor) return settings.headerBgColor;
      return getInitialHeaderColor();
    } catch {
      return 'slate-900';
    }
  });

  // Apply header color whenever headerBgColor changes
  useEffect(() => {
    applyHeaderColor(headerBgColor);
  }, [headerBgColor]);

  const setHeaderBgColor = (color: string) => {
    setHeaderBgColorState(color);
    applyHeaderColor(color);
    setSettings((s) => ({ ...s, headerBgColor: color }));
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFT, JSON.stringify(cashShift));
  }, [cashShift]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Online / Offline & Local Persistence Queue State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [offlineQueueItems, setOfflineQueueItems] = useState<OfflineSyncItem[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  // Refresh offline queue items and pending count from IndexedDB
  const refreshOfflineQueue = async () => {
    try {
      const all = await getAllOfflineSales();
      setOfflineQueueItems(all);
      const pending = all.filter((i) => i.status === 'pending' || i.status === 'failed');
      setPendingSyncCount(pending.length);
    } catch (err) {
      console.error('Error al consultar cola offline en IndexedDB:', err);
    }
  };

  // Initial load of offline queue on mount
  useEffect(() => {
    refreshOfflineQueue();
  }, []);

  // Synchronization with Google Sheets logic with retry support
  const syncPendingOfflineSales = async (): Promise<{
    success: boolean;
    count: number;
    message: string;
  }> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const msg = 'No hay conexión a internet para sincronizar con Google Sheets.';
      setLastSyncMessage(msg);
      return { success: false, count: 0, message: msg };
    }

    const pending = await getPendingOfflineSales();
    if (pending.length === 0) {
      await refreshOfflineQueue();
      const msg = 'No hay transacciones pendientes por sincronizar.';
      setLastSyncMessage(msg);
      return { success: true, count: 0, message: msg };
    }

    const spreadsheetId = localStorage.getItem('pos_google_sheets_id');
    const token = await getAccessToken();

    if (!spreadsheetId) {
      const msg = `${pending.length} venta(s) guardadas localmente en IndexedDB. Vincula tu hoja de Google Sheets en el menú de sincronización para enviarlas.`;
      setLastSyncMessage(msg);
      await refreshOfflineQueue();
      return { success: false, count: pending.length, message: msg };
    }

    if (!token) {
      const msg = `${pending.length} venta(s) listas en cola local. Inicia sesión con Google para sincronizar con Sheets.`;
      setLastSyncMessage(msg);
      await refreshOfflineQueue();
      return { success: false, count: pending.length, message: msg };
    }

    setIsSyncingSheets(true);
    setLastSyncMessage(`Sincronizando ${pending.length} venta(s) pendientes con Google Sheets...`);

    try {
      const salesToSync = pending.map((p) => p.sale);
      await appendSalesToSheet(token, spreadsheetId, salesToSync);

      // Mark batch as synced in IndexedDB
      const syncedIds = pending.map((p) => p.id);
      await markOfflineSalesSyncedBatch(syncedIds);

      // Update state in sales list
      const nowStr = new Date().toISOString();
      const syncedSet = new Set(syncedIds);
      setSales((prev) =>
        prev.map((s) => (syncedSet.has(s.id) ? { ...s, syncedToSheets: true, syncedAt: nowStr } : s))
      );

      await refreshOfflineQueue();
      const msg = `¡Sincronización exitosa! ${pending.length} venta(s) guardadas localmente se sincronizaron con Google Sheets.`;
      setLastSyncMessage(msg);
      return { success: true, count: pending.length, message: msg };
    } catch (err: any) {
      console.error('Error al sincronizar con Google Sheets:', err);
      for (const item of pending) {
        await markOfflineSaleFailed(item.id, err?.message || 'Error de conexión');
      }
      await refreshOfflineQueue();
      const msg = `Error al sincronizar: ${err?.message || 'Fallo de conexión'}. Se reintentará automáticamente al recuperar conexión.`;
      setLastSyncMessage(msg);
      return { success: false, count: pending.length, message: msg };
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Listen to browser online/offline network events & auto-retry sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncMessage('Conexión a internet restablecida. Reintentando sincronización con Google Sheets...');
      // Trigger automatic retry upon connection recovery
      syncPendingOfflineSales();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastSyncMessage('Modo sin conexión: Las ventas se guardarán de forma segura en tu dispositivo (IndexedDB).');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic retry mechanism: every 45s if online and there are pending sales
  useEffect(() => {
    if (!isOnline || pendingSyncCount === 0 || isSyncingSheets) return;

    const interval = setInterval(() => {
      syncPendingOfflineSales();
    }, 45000);

    return () => clearInterval(interval);
  }, [isOnline, pendingSyncCount, isSyncingSheets]);

  const clearSyncedOfflineQueue = async () => {
    await clearSyncedOfflineSales();
    await refreshOfflineQueue();
  };

  // Cart math
  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cart actions
  const addToCart = (
    product: Product,
    quantity: number = 1,
    isBulk: boolean = false,
    bulkAmountInPesos?: number
  ) => {
    if (settings.soundEnabled) {
      soundEffects.scan();
    }

    setCart((prev) => {
      // If bulk and specified in pesos or specific weight, add as separate or update
      if (isBulk && bulkAmountInPesos !== undefined) {
        const calculatedQty = Number((bulkAmountInPesos / product.salePrice).toFixed(3));
        const newItem: CartItem = {
          id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product,
          quantity: calculatedQty,
          unitPrice: product.salePrice,
          total: bulkAmountInPesos,
          isBulk: true,
          bulkAmountInPesos
        };
        return [...prev, newItem];
      }

      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && !item.bulkAmountInPesos
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIndex];
        const newQty = Number((currentItem.quantity + quantity).toFixed(3));
        const newTotal = Number((newQty * product.salePrice).toFixed(2));
        updated[existingIndex] = {
          ...currentItem,
          quantity: newQty,
          total: newTotal
        };
        return updated;
      } else {
        const itemTotal = Number((quantity * product.salePrice).toFixed(2));
        const newItem: CartItem = {
          id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product,
          quantity,
          unitPrice: product.salePrice,
          total: itemTotal,
          isBulk: product.isBulk || isBulk
        };
        return [...prev, newItem];
      }
    });
  };

  const updateCartItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const validQty = Number(quantity.toFixed(3));
          return {
            ...item,
            quantity: validQty,
            total: Number((validQty * item.unitPrice).toFixed(2)),
            bulkAmountInPesos: undefined
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Complete Sale
  const completeSale = ({
    paymentMethod,
    amountPaid,
    customerId,
    cashier,
    discount = 0
  }: CompleteSaleParams): Sale | null => {
    if (cart.length === 0) return null;

    const effectiveCashier = cashier || currentUser?.name || 'Cajero 1';
    const total = Math.max(0, cartSubtotal - discount);
    const change = paymentMethod === 'efectivo' ? Math.max(0, amountPaid - total) : 0;

    const nextFolio = sales.length > 0 ? Math.max(...sales.map((s) => s.folio)) + 1 : 1001;

    let targetCustomerName = undefined;
    if (customerId) {
      const cust = customers.find((c) => c.id === customerId);
      if (cust) {
        targetCustomerName = cust.name;
      }
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const isCurrentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      folio: nextFolio,
      date: formattedDate,
      items: [...cart],
      subtotal: cartSubtotal,
      discount,
      total,
      paymentMethod,
      amountPaid: paymentMethod === 'efectivo' ? amountPaid : total,
      change,
      customerId,
      customerName: targetCustomerName,
      cashier: effectiveCashier,
      syncedToSheets: false,
      offlineRecorded: !isCurrentlyOnline
    };

    // 1. Deduct inventory stock
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItemsForProd = cart.filter((ci) => ci.product.id === prod.id);
        if (cartItemsForProd.length === 0) return prod;
        const totalQtySold = cartItemsForProd.reduce((sum, ci) => sum + ci.quantity, 0);
        const newStock = Number(Math.max(0, prod.stock - totalQtySold).toFixed(3));
        return { ...prod, stock: newStock };
      })
    );

    // 2. If 'fiado', charge to customer balance and history
    if (paymentMethod === 'fiado' && customerId) {
      const summaryItems = cart.map((i) => `${i.quantity} ${i.product.unit} ${i.product.name}`).slice(0, 3).join(', ');
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === customerId) {
            const newBalance = Number((cust.balance + total).toFixed(2));
            const newMovement = {
              id: `mov-${Date.now()}`,
              date: formattedDate,
              type: 'cargo' as const,
              amount: total,
              note: `Venta Folio #${nextFolio} (${summaryItems}${cart.length > 3 ? '...' : ''})`,
              folio: nextFolio
            };
            return {
              ...cust,
              balance: newBalance,
              history: [newMovement, ...cust.history]
            };
          }
          return cust;
        })
      );
    }

    // 3. Save sale in memory & state
    setSales((prev) => [newSale, ...prev]);

    // 4. Persist in IndexedDB offline queue and attempt immediate sync if online
    enqueueOfflineSale(newSale)
      .then(async () => {
        await refreshOfflineQueue();

        const spreadsheetId = localStorage.getItem('pos_google_sheets_id');
        const token = await getAccessToken();

        if (isCurrentlyOnline && spreadsheetId && token) {
          try {
            await appendSalesToSheet(token, spreadsheetId, [newSale]);
            await markOfflineSalesSyncedBatch([newSale.id]);
            setSales((prev) =>
              prev.map((s) =>
                s.id === newSale.id
                  ? { ...s, syncedToSheets: true, syncedAt: new Date().toISOString() }
                  : s
              )
            );
            await refreshOfflineQueue();
          } catch (syncErr: any) {
            console.warn('Sync inmediato con Google Sheets falló (se mantendrá en cola IndexedDB):', syncErr);
            await markOfflineSaleFailed(newSale.id, syncErr?.message || 'Error de conexión');
            await refreshOfflineQueue();
          }
        }
      })
      .catch((err) => {
        console.error('Error al persistir venta en cola local IndexedDB:', err);
      });

    // 5. Play success audio
    if (settings.soundEnabled) {
      soundEffects.cashSuccess();
    }

    // 6. Clear cart
    setCart([]);

    return newSale;
  };

  // Cancel / Refund sale
  const cancelSale = (saleId: string) => {
    const saleToCancel = sales.find((s) => s.id === saleId);
    if (!saleToCancel) return;

    // Restore stock
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItemsForProd = saleToCancel.items.filter((ci) => ci.product.id === prod.id);
        if (cartItemsForProd.length === 0) return prod;
        const totalQtyRestored = cartItemsForProd.reduce((sum, ci) => sum + ci.quantity, 0);
        return { ...prod, stock: Number((prod.stock + totalQtyRestored).toFixed(3)) };
      })
    );

    // If fiado, reverse debt
    if (saleToCancel.paymentMethod === 'fiado' && saleToCancel.customerId) {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === saleToCancel.customerId) {
            const newBalance = Math.max(0, Number((cust.balance - saleToCancel.total).toFixed(2)));
            return {
              ...cust,
              balance: newBalance,
              history: [
                {
                  id: `mov-${Date.now()}`,
                  date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                  type: 'abono' as const,
                  amount: saleToCancel.total,
                  note: `Cancelación Venta Folio #${saleToCancel.folio}`,
                  folio: saleToCancel.folio
                },
                ...cust.history
              ]
            };
          }
          return cust;
        })
      );
    }

    // Remove from sales list
    setSales((prev) => prev.filter((s) => s.id !== saleId));
  };

  // Reset all sales (e.g. from Dashboard or testing)
  const resetSales = (options?: { restoreStock?: boolean; resetShiftSales?: boolean }) => {
    const restoreStock = options?.restoreStock ?? false;
    const resetShiftSales = options?.resetShiftSales ?? true;

    // 1. If restore stock requested, return sold quantities back to product inventory
    if (restoreStock && sales.length > 0) {
      setProducts((prev) => {
        const qtySoldMap: Record<string, number> = {};
        sales.forEach((sale) => {
          sale.items.forEach((item) => {
            qtySoldMap[item.product.id] = (qtySoldMap[item.product.id] || 0) + item.quantity;
          });
        });

        return prev.map((p) => {
          const qtyToRestore = qtySoldMap[p.id];
          if (qtyToRestore && qtyToRestore > 0) {
            return {
              ...p,
              stock: Math.max(0, Number((p.stock + qtyToRestore).toFixed(3)))
            };
          }
          return p;
        });
      });
    }

    // 2. Clear sales state and persistent storage
    setSales([]);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));

    // 3. Reset sales in active cash shift if requested
    if (resetShiftSales) {
      setCashShift((prev) => ({
        ...prev,
        sales: []
      }));
    }

    // 4. Clear offline sync queue in IndexedDB
    clearAllOfflineSales()
      .then(() => refreshOfflineQueue())
      .catch((err) => console.warn('Error al limpiar cola offline:', err));
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const adjustStock = (id: string, quantityToAdd: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStock = Math.max(0, Number((p.stock + quantityToAdd).toFixed(3)));
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
  };

  const resetAllData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSales(INITIAL_SALES);
    setCashShift(INITIAL_CASH_SHIFT);
    setSettings(INITIAL_SETTINGS);
    setCart([]);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.SHIFT);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  };

  // Customer Actions
  const addCustomer = (customerData: Omit<Customer, 'id' | 'balance' | 'history'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      balance: 0,
      history: []
    };
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const addCustomerPayment = (customerId: string, amount: number, note: string) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === customerId) {
          const newBalance = Math.max(0, Number((cust.balance - amount).toFixed(2)));
          const movement = {
            id: `mov-${Date.now()}`,
            date: formattedDate,
            type: 'abono' as const,
            amount,
            note: note || 'Abono en efectivo'
          };
          return {
            ...cust,
            balance: newBalance,
            history: [movement, ...cust.history]
          };
        }
        return cust;
      })
    );

    // Register cash entrance in current shift
    addCashMovement('entrada', amount, `Abono a cuenta de cliente (${note || 'Fiado'})`);
    if (settings.soundEnabled) {
      soundEffects.cashSuccess();
    }
  };

  // Cash shift movements
  const addCashMovement = (type: 'entrada' | 'salida', amount: number, reason: string) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      time,
      type,
      amount,
      reason
    };
    setCashShift((prev) => ({
      ...prev,
      movements: [newMovement, ...prev.movements]
    }));
  };

  const closeShift = (countedCash: number) => {
    const now = new Date();
    const closedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCashShift((prev) => ({
      ...prev,
      status: 'closed',
      closedAt,
      countedCash
    }));
  };

  const startNewShift = (initialCash: number) => {
    const now = new Date();
    const openedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCashShift({
      id: `shift-${Date.now()}`,
      openedAt,
      initialCash,
      movements: [],
      status: 'open'
    });
  };

  const updateSettings = (newSettings: StoreSettings) => {
    if (newSettings.theme && newSettings.theme !== theme) {
      setThemeState(newSettings.theme);
    }
    if (newSettings.primaryColor && newSettings.primaryColor !== primaryColor) {
      setPrimaryColorState(newSettings.primaryColor);
      applyThemeColor(newSettings.primaryColor);
    }
    if (newSettings.headerBgColor && newSettings.headerBgColor !== headerBgColor) {
      setHeaderBgColorState(newSettings.headerBgColor);
      applyHeaderColor(newSettings.headerBgColor);
    }
    if (typeof newSettings.highContrast === 'boolean' && newSettings.highContrast !== highContrast) {
      setHighContrastState(newSettings.highContrast);
    }
    if (newSettings.kioskMode && (activeTab === 'inventario' || activeTab === 'fiados')) {
      setActiveTab('pos');
    }
    setSettings(newSettings);
  };

  const setKioskMode = (enabled: boolean) => {
    if (enabled && (activeTab === 'inventario' || activeTab === 'fiados')) {
      setActiveTab('pos');
    }
    setSettings((prev) => ({
      ...prev,
      kioskMode: enabled
    }));
  };

  // User Authentication & Session Handlers
  const login = (usernameOrId: string, pin: string) => {
    const trimmedInput = usernameOrId.trim().toLowerCase();
    const trimmedPin = pin.trim();

    const user = users.find(
      (u) =>
        u.id === usernameOrId ||
        u.username.toLowerCase() === trimmedInput ||
        u.name.toLowerCase() === trimmedInput
    );

    if (!user) {
      return { success: false, error: 'Usuario no encontrado. Verifica el nombre o regístrate.' };
    }

    if (user.pin !== trimmedPin) {
      return { success: false, error: 'PIN o contraseña de acceso incorrecta.' };
    }

    const updatedUser: User = {
      ...user,
      lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
    return { success: true };
  };

  const register = (data: {
    username: string;
    name: string;
    role: 'admin' | 'cashier';
    pin: string;
    emoji?: string;
    phone?: string;
  }) => {
    const trimmedUsername = data.username.trim().toLowerCase();
    const trimmedName = data.name.trim();
    const trimmedPin = data.pin.trim();

    if (!trimmedUsername || trimmedUsername.length < 3) {
      return { success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' };
    }
    if (!trimmedName) {
      return { success: false, error: 'El nombre completo es obligatorio.' };
    }
    if (!trimmedPin || trimmedPin.length < 4) {
      return { success: false, error: 'El PIN de seguridad debe tener al menos 4 dígitos o caracteres.' };
    }

    const exists = users.some((u) => u.username.toLowerCase() === trimmedUsername);
    if (exists) {
      return { success: false, error: `El nombre de usuario "${trimmedUsername}" ya está registrado.` };
    }

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username: trimmedUsername,
      name: trimmedName,
      role: data.role,
      pin: trimmedPin,
      emoji: data.emoji || (data.role === 'admin' ? '👨‍💼' : '🧑‍💼'),
      phone: data.phone?.trim() || '',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newUser));
    } catch {
      // ignore
    }
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {
      // ignore
    }
  };

  const switchUser = (userId: string, pin: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Usuario no encontrado.' };
    }
    if (target.pin !== pin.trim()) {
      return { success: false, error: 'PIN o contraseña incorrecta para este usuario.' };
    }
    const updatedUser: User = {
      ...target,
      lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
    return { success: true };
  };

  const updateUser = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const deleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'Usuario no encontrado.' };

    if (target.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, error: 'No es posible eliminar el único Administrador de la tienda.' };
      }
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser?.id === userId) {
      const remaining = users.find((u) => u.id !== userId) || null;
      setCurrentUser(remaining);
      try {
        if (remaining) {
          localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(remaining));
        } else {
          localStorage.removeItem(STORAGE_KEYS.SESSION);
        }
      } catch {
        // ignore
      }
    }
    return { success: true };
  };

  return (
    <POSContext.Provider
      value={{
        products,
        setProducts,
        cart,
        sales,
        customers,
        cashShift,
        settings,
        activeTab,
        setActiveTab,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartTotalCount,
        completeSale,
        cancelSale,
        resetSales,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        resetAllData,
        addCustomer,
        deleteCustomer,
        addCustomerPayment,
        addCashMovement,
        closeShift,
        startNewShift,
        updateSettings,
        theme,
        toggleTheme,
        setTheme,
        primaryColor,
        setPrimaryColor,
        headerBgColor,
        setHeaderBgColor,
        highContrast,
        toggleHighContrast,
        setKioskMode,
        isOnline,
        pendingSyncCount,
        isSyncingSheets,
        lastSyncMessage,
        syncPendingOfflineSales,
        offlineQueueItems,
        refreshOfflineQueue,
        clearSyncedOfflineQueue,
        currentUser,
        users,
        login,
        register,
        logout,
        switchUser,
        updateUser,
        deleteUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
