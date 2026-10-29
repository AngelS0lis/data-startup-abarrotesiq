import { Sale, OfflineSyncItem } from '../types';

const DB_NAME = 'AbarrotesPOS_DB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_sales_queue';
const LOCAL_STORAGE_FALLBACK_KEY = 'pos_offline_sales_queue_v1';

/**
 * Open or initialize the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este navegador.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('queuedAt', 'queuedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Error al abrir base de datos IndexedDB.'));
    };
  });
}

/**
 * Fallback helpers using localStorage
 */
function getFallbackQueue(): OfflineSyncItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFallbackQueue(items: OfflineSyncItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error al guardar en localStorage fallback:', err);
  }
}

/**
 * Save / Enqueue a sale to the local offline queue
 */
export async function enqueueOfflineSale(sale: Sale): Promise<OfflineSyncItem> {
  const item: OfflineSyncItem = {
    id: sale.id,
    sale,
    queuedAt: new Date().toISOString(),
    attempts: 0,
    status: 'pending'
  };

  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(item);

      putRequest.onsuccess = () => resolve(item);
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.warn('Fallo al guardar en IndexedDB, usando localStorage de respaldo:', err);
    const queue = getFallbackQueue();
    const existingIndex = queue.findIndex((q) => q.id === item.id);
    if (existingIndex >= 0) {
      queue[existingIndex] = item;
    } else {
      queue.push(item);
    }
    saveFallbackQueue(queue);
    return item;
  }
}

/**
 * Get all sales currently in the queue
 */
export async function getAllOfflineSales(): Promise<OfflineSyncItem[]> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return getFallbackQueue();
  }
}

/**
 * Get all sales pending synchronization
 */
export async function getPendingOfflineSales(): Promise<OfflineSyncItem[]> {
  try {
    const all = await getAllOfflineSales();
    return all.filter((item) => item.status === 'pending' || item.status === 'failed');
  } catch {
    return getFallbackQueue().filter((item) => item.status === 'pending' || item.status === 'failed');
  }
}

/**
 * Mark a batch of sales as successfully synced to Google Sheets
 */
export async function markOfflineSalesSyncedBatch(saleIds: string[]): Promise<void> {
  const idSet = new Set(saleIds);
  const now = new Date().toISOString();

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items: OfflineSyncItem[] = request.result || [];
        for (const item of items) {
          if (idSet.has(item.id)) {
            item.status = 'synced';
            item.lastAttemptAt = now;
            item.sale.syncedToSheets = true;
            item.sale.syncedAt = now;
            store.put(item);
          }
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    const queue = getFallbackQueue();
    for (const item of queue) {
      if (idSet.has(item.id)) {
        item.status = 'synced';
        item.lastAttemptAt = now;
        item.sale.syncedToSheets = true;
        item.sale.syncedAt = now;
      }
    }
    saveFallbackQueue(queue);
  }
}

/**
 * Update the attempt counter and error for a failed sync item
 */
export async function markOfflineSaleFailed(saleId: string, errorMessage: string): Promise<void> {
  const now = new Date().toISOString();

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(saleId);

      request.onsuccess = () => {
        const item: OfflineSyncItem | undefined = request.result;
        if (item) {
          item.status = 'failed';
          item.attempts = (item.attempts || 0) + 1;
          item.lastAttemptAt = now;
          item.errorMessage = errorMessage;
          store.put(item);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    const queue = getFallbackQueue();
    const item = queue.find((q) => q.id === saleId);
    if (item) {
      item.status = 'failed';
      item.attempts = (item.attempts || 0) + 1;
      item.lastAttemptAt = now;
      item.errorMessage = errorMessage;
      saveFallbackQueue(queue);
    }
  }
}

/**
 * Remove an item from the offline sync queue
 */
export async function removeOfflineSale(saleId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(saleId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const queue = getFallbackQueue().filter((q) => q.id !== saleId);
    saveFallbackQueue(queue);
  }
}

/**
 * Remove already synced transactions to keep storage clean
 */
export async function clearSyncedOfflineSales(): Promise<number> {
  let clearedCount = 0;
  try {
    const db = await openDB();
    clearedCount = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items: OfflineSyncItem[] = request.result || [];
        let count = 0;
        for (const item of items) {
          if (item.status === 'synced') {
            store.delete(item.id);
            count++;
          }
        }
        resolve(count);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    const queue = getFallbackQueue();
    const pendingOnly = queue.filter((q) => q.status !== 'synced');
    clearedCount = queue.length - pendingOnly.length;
    saveFallbackQueue(pendingOnly);
  }
  return clearedCount;
}

/**
 * Clear all offline sales queue (e.g. when resetting sales history)
 */
export async function clearAllOfflineSales(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    saveFallbackQueue([]);
  }
}
