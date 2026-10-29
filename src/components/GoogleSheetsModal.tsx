import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Plus,
  Link2,
  LogOut,
  FolderOpen,
  Database,
  Wifi,
  WifiOff,
  Clock,
  Trash2
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import {
  googleSignIn,
  initAuth,
  logoutGoogle,
  getAccessToken
} from '../services/googleAuth';
import {
  listUserSpreadsheets,
  createPOSSpreadsheet,
  exportInventoryToSheet,
  exportSalesToSheet,
  exportCustomersToSheet,
  exportShiftToSheet,
  importInventoryFromSheet,
  DriveSpreadsheetFile
} from '../services/googleSheets';
import { User } from 'firebase/auth';

interface GoogleSheetsModalProps {
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ onClose }) => {
  const {
    products,
    sales,
    customers,
    cashShift,
    settings,
    setProducts,
    isOnline,
    pendingSyncCount,
    isSyncingSheets,
    lastSyncMessage,
    syncPendingOfflineSales,
    offlineQueueItems,
    refreshOfflineQueue,
    clearSyncedOfflineQueue
  } = usePOS();

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Spreadsheet state (persisted in localStorage)
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('pos_google_sheets_id') || '';
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => {
    return localStorage.getItem('pos_google_sheets_url') || '';
  });

  // User drive files
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState<boolean>(false);

  // Action states & feedback
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Mandatory Confirmation Dialog for mutating Google Sheets data
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Initialize Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Drive spreadsheets when user is authenticated
  useEffect(() => {
    if (accessToken) {
      loadDriveFiles(accessToken);
    }
  }, [accessToken]);

  const loadDriveFiles = async (token: string) => {
    setIsLoadingDriveFiles(true);
    try {
      const files = await listUserSpreadsheets(token);
      setDriveFiles(files);
    } catch (err) {
      console.error('Error fetching spreadsheets:', err);
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setSyncStatus(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err.message || 'Error al iniciar sesión con Google'
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setAccessToken(null);
  };

  const saveLinkedSpreadsheet = (id: string, url: string) => {
    setSpreadsheetId(id);
    setSpreadsheetUrl(url);
    localStorage.setItem('pos_google_sheets_id', id);
    localStorage.setItem('pos_google_sheets_url', url);
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const result = await createPOSSpreadsheet(accessToken, settings.storeName);
      saveLinkedSpreadsheet(result.id, result.url);
      setSyncStatus({
        type: 'success',
        message: '¡Hoja de cálculo creada exitosamente en tu Google Drive!'
      });
      // Refresh list
      loadDriveFiles(accessToken);
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err.message || 'Error al crear la hoja de cálculo en Google Sheets'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Safe Export with Mandatory Confirmation Dialog
  const requestExportAll = () => {
    if (!spreadsheetId) {
      setSyncStatus({
        type: 'error',
        message: 'Primero debes crear o seleccionar una hoja de cálculo.'
      });
      return;
    }

    setPendingConfirmation({
      title: '¿Confirmas sincronizar todos los datos con Google Sheets?',
      description: `Se sobrescribirán o actualizarán las pestañas en tu hoja de Google Sheets con: ${products.length} productos de inventario, ${sales.length} ventas del historial, ${customers.length} clientes de fiados y el corte de caja actual.`,
      onConfirm: async () => {
        if (!accessToken) return;
        setIsSyncing(true);
        setSyncStatus(null);
        try {
          await exportInventoryToSheet(accessToken, spreadsheetId, products);
          await exportSalesToSheet(accessToken, spreadsheetId, sales);
          await exportCustomersToSheet(accessToken, spreadsheetId, customers);
          await exportShiftToSheet(accessToken, spreadsheetId, cashShift);

          setSyncStatus({
            type: 'success',
            message: '¡Todos los datos (inventario, ventas, fiados y corte) se sincronizaron con Google Sheets!'
          });
        } catch (err: any) {
          setSyncStatus({
            type: 'error',
            message: err.message || 'Error al sincronizar con Google Sheets'
          });
        } finally {
          setIsSyncing(false);
          setPendingConfirmation(null);
        }
      }
    });
  };

  const requestExportInventory = () => {
    if (!spreadsheetId) return;
    setPendingConfirmation({
      title: '¿Exportar Inventario a Google Sheets?',
      description: `Se enviarán ${products.length} artículos con códigos, precios, existencias y márgenes a la pestaña "Inventario".`,
      onConfirm: async () => {
        if (!accessToken) return;
        setIsSyncing(true);
        try {
          await exportInventoryToSheet(accessToken, spreadsheetId, products);
          setSyncStatus({
            type: 'success',
            message: `¡Se exportaron ${products.length} productos a Google Sheets!`
          });
        } catch (err: any) {
          setSyncStatus({ type: 'error', message: err.message });
        } finally {
          setIsSyncing(false);
          setPendingConfirmation(null);
        }
      }
    });
  };

  const requestExportSales = () => {
    if (!spreadsheetId) return;
    setPendingConfirmation({
      title: '¿Exportar Historial de Ventas?',
      description: `Se enviarán ${sales.length} registros de ventas a la pestaña "Ventas".`,
      onConfirm: async () => {
        if (!accessToken) return;
        setIsSyncing(true);
        try {
          await exportSalesToSheet(accessToken, spreadsheetId, sales);
          setSyncStatus({
            type: 'success',
            message: `¡Se exportaron ${sales.length} ventas a Google Sheets!`
          });
        } catch (err: any) {
          setSyncStatus({ type: 'error', message: err.message });
        } finally {
          setIsSyncing(false);
          setPendingConfirmation(null);
        }
      }
    });
  };

  const requestImportInventory = () => {
    if (!spreadsheetId) return;
    setPendingConfirmation({
      title: '¿Importar Catálogo desde Google Sheets?',
      description:
        'Se leerán los artículos de la pestaña "Inventario" de tu hoja de cálculo y se actualizarán en el sistema local del punto de venta.',
      onConfirm: async () => {
        if (!accessToken) return;
        setIsSyncing(true);
        try {
          const imported = await importInventoryFromSheet(accessToken, spreadsheetId);
          if (imported.length === 0) {
            setSyncStatus({
              type: 'error',
              message: 'No se encontraron filas con productos en la pestaña "Inventario".'
            });
            return;
          }

          // Merge or update products
          const updatedList = [...products];
          let addedCount = 0;
          let updatedCount = 0;

          imported.forEach((imp) => {
            const existingIdx = updatedList.findIndex(
              (p) => (imp.code && p.code === imp.code) || p.name.toLowerCase() === (imp.name || '').toLowerCase()
            );

            if (existingIdx >= 0) {
              updatedList[existingIdx] = {
                ...updatedList[existingIdx],
                salePrice: imp.salePrice ?? updatedList[existingIdx].salePrice,
                costPrice: imp.costPrice ?? updatedList[existingIdx].costPrice,
                stock: imp.stock ?? updatedList[existingIdx].stock,
                category: imp.category ?? updatedList[existingIdx].category
              };
              updatedCount++;
            } else if (imp.name && imp.salePrice !== undefined) {
              updatedList.push({
                id: `prod-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: imp.name,
                code: imp.code || `GEN-${Date.now()}`,
                category: imp.category || 'despensa',
                salePrice: imp.salePrice,
                costPrice: imp.costPrice || 0,
                stock: imp.stock || 0,
                minStock: 5,
                unit: imp.unit || 'pza',
                isQuickAccess: false
              });
              addedCount++;
            }
          });

          setProducts(updatedList);
          setSyncStatus({
            type: 'success',
            message: `¡Importación completada! ${addedCount} productos nuevos agregados, ${updatedCount} actualizados.`
          });
        } catch (err: any) {
          setSyncStatus({ type: 'error', message: err.message });
        } finally {
          setIsSyncing(false);
          setPendingConfirmation(null);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="font-extrabold text-base">Google Sheets para Abarrotes</h2>
              <span className="text-[11px] text-emerald-200">
                Sincroniza inventario, ventas, fiados y corte en la nube
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[82vh] overflow-y-auto text-slate-800">
          {/* Status Message */}
          {syncStatus && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                syncStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {syncStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}

          {/* Authentication Section */}
          {!currentUser ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 bg-white rounded-full shadow-xs border border-slate-200 mx-auto flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Conecta tu cuenta de Google
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Permite al punto de venta crear y actualizar tus hojas de cálculo en Google Drive
                  para respaldar tus ventas y modificar inventario desde cualquier lugar.
                </p>
              </div>

              {/* Official Google Sign In Button */}
              <div className="pt-1 flex justify-center">
                <button
                  type="button"
                  id="btn-google-signin"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="gsi-material-button relative inline-flex items-center justify-center bg-white border border-slate-300 hover:border-slate-400 hover:shadow-sm px-4 py-2.5 rounded-full text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="gsi-material-button-icon mr-2.5">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="w-4 h-4 block"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  </div>
                  <span>
                    {isSigningIn ? 'Conectando con Google...' : 'Iniciar sesión con Google'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {currentUser.displayName || 'Usuario de Google'}
                  </h4>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="py-1.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Cerrar sesión de Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          )}

          {/* Active Sheet Card */}
          {currentUser && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-emerald-500/40 rounded-2xl p-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      Hoja de Google Sheets Vinculada
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                      {spreadsheetId
                        ? `ID: ${spreadsheetId.substring(0, 16)}...`
                        : 'Ninguna hoja vinculada actualmente'}
                    </h3>
                  </div>

                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Abrir en Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Quick actions for Sheet Creation / Selection */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateNewSheet}
                    disabled={isSyncing}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear Hoja Nueva de la Tienda</span>
                  </button>

                  {driveFiles.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={spreadsheetId}
                        onChange={(e) => {
                          const selected = driveFiles.find((f) => f.id === e.target.value);
                          if (selected) {
                            saveLinkedSpreadsheet(
                              selected.id,
                              selected.webViewLink ||
                                `https://docs.google.com/spreadsheets/d/${selected.id}/edit`
                            );
                          }
                        }}
                        className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-hidden max-w-xs truncate"
                      >
                        <option value="">-- O seleccionar hoja de tu Drive --</option>
                        {driveFiles.map((file) => (
                          <option key={file.id} value={file.id}>
                            {file.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Actions Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Acciones de Sincronización
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Sincronizar Todo */}
                  <button
                    type="button"
                    onClick={requestExportAll}
                    disabled={isSyncing || !spreadsheetId}
                    className="p-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl font-bold text-xs flex items-center gap-3 transition-colors text-left shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-700/50 flex items-center justify-center shrink-0">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm">Sincronizar Todo a Sheets</span>
                      <span className="text-[10px] font-normal opacity-90 block">
                        Inventario, ventas, fiados y corte
                      </span>
                    </div>
                  </button>

                  {/* Importar Inventario desde Sheets */}
                  <button
                    type="button"
                    onClick={requestImportInventory}
                    disabled={isSyncing || !spreadsheetId}
                    className="p-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl font-bold text-xs flex items-center gap-3 transition-colors text-left shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-700/50 flex items-center justify-center shrink-0">
                      <DownloadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm">Importar desde Sheets</span>
                      <span className="text-[10px] font-normal opacity-90 block">
                        Actualizar catálogo y precios
                      </span>
                    </div>
                  </button>

                  {/* Exportar sólo inventario */}
                  <button
                    type="button"
                    onClick={requestExportInventory}
                    disabled={isSyncing || !spreadsheetId}
                    className="p-3 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between"
                  >
                    <span>Exportar sólo Inventario ({products.length})</span>
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                  </button>

                  {/* Exportar sólo ventas */}
                  <button
                    type="button"
                    onClick={requestExportSales}
                    disabled={isSyncing || !spreadsheetId}
                    className="p-3 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between"
                  >
                    <span>Exportar sólo Ventas ({sales.length})</span>
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Offline Persistence & Queue Section (IndexedDB) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Persistencia Fuera de Línea (IndexedDB)
                  </h3>
                  <span className="text-[11px] text-slate-500 block">
                    Almacenamiento seguro en tu navegador y reintento de sincronización
                  </span>
                </div>
              </div>

              {/* Network badge */}
              {isOnline ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>En línea</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sin conexión</span>
                </span>
              )}
            </div>

            {lastSyncMessage && (
              <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="leading-tight">{lastSyncMessage}</span>
              </div>
            )}

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Pendientes de Sincronizar
                </span>
                <span
                  className={`text-xl font-black font-mono ${
                    pendingSyncCount > 0 ? 'text-amber-600' : 'text-slate-700'
                  }`}
                >
                  {pendingSyncCount}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Total Registradas en Cola
                </span>
                <span className="text-xl font-black font-mono text-slate-700">
                  {offlineQueueItems.length}
                </span>
              </div>
            </div>

            {/* Offline queue preview list if items exist */}
            {offlineQueueItems.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Transacciones registradas localmente:</span>
                  <button
                    type="button"
                    onClick={() => clearSyncedOfflineQueue()}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    title="Limpiar de la base de datos local las transacciones ya sincronizadas"
                  >
                    <Trash2 className="w-3 h-3 text-slate-400" />
                    <span>Limpiar sincronizadas</span>
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 bg-white rounded-xl p-2">
                  {offlineQueueItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">
                          #{item.sale.folio}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {item.sale.date.slice(11)}
                        </span>
                        <span className="font-mono font-semibold text-emerald-700">
                          ${item.sale.total.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.status === 'synced' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sincronizada
                          </span>
                        ) : item.status === 'failed' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Reintento #{item.attempts}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sync now button */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                id="modal-btn-retry-offline-sync"
                onClick={async () => {
                  const res = await syncPendingOfflineSales();
                  setSyncStatus({
                    type: res.success ? 'success' : 'error',
                    message: res.message
                  });
                }}
                disabled={isSyncingSheets || !isOnline || pendingSyncCount === 0}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncingSheets
                    ? 'Sincronizando con Sheets...'
                    : pendingSyncCount > 0
                    ? `Sincronizar ${pendingSyncCount} pendiente(s) ahora`
                    : 'Todo sincronizado'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for mutating Google Sheets */}
      {pendingConfirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {pendingConfirmation.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {pendingConfirmation.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingConfirmation(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => pendingConfirmation.onConfirm()}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Confirmar y Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
