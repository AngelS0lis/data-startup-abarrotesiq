import React, { useEffect, useState } from 'react';
import {
  Store,
  ShoppingCart,
  Boxes,
  BookUser,
  Calculator,
  ReceiptText,
  Volume2,
  VolumeX,
  Settings,
  CircleDollarSign,
  FileSpreadsheet,
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  Unlock,
  KeyRound,
  X,
  Check,
  Eye,
  EyeOff,
  LogIn,
  User as UserIcon
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundEffects } from '../utils/audio';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenGoogleSheets?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenGoogleSheets }) => {
  const {
    settings,
    updateSettings,
    activeTab,
    setActiveTab,
    cartTotalCount,
    sales,
    cashShift,
    isOnline,
    pendingSyncCount,
    isSyncingSheets,
    syncPendingOfflineSales,
    currentUser,
    setIsAuthModalOpen,
    setAuthModalMode
  } = usePOS();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showUnlockPin, setShowUnlockPin] = useState<boolean>(false);

  const handleSettingsClick = () => {
    if (settings.kioskMode) {
      setPinInput('');
      setPinError('');
      setIsUnlockModalOpen(true);
    } else {
      onOpenSettings();
    }
  };

  const handleVerifyPin = (targetAction: 'exit' | 'settings') => {
    const configuredPin = settings.kioskPin && settings.kioskPin.trim() ? settings.kioskPin.trim() : '1234';
    const entered = pinInput.trim();

    if (entered === configuredPin || (!settings.kioskPin && (entered === '1234' || entered === ''))) {
      setPinError('');
      setPinInput('');
      setIsUnlockModalOpen(false);
      soundEffects.cashSuccess();
      if (targetAction === 'exit') {
        updateSettings({ ...settings, kioskMode: false });
      } else {
        onOpenSettings();
      }
    } else {
      setPinError('PIN incorrecto. Por defecto es 1234.');
      soundEffects.error();
    }
  };

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Today's total sales
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((s) => s.date.startsWith(todayStr));
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);

  return (
    <header
      id="main-pos-header"
      style={{
        backgroundColor: 'var(--header-bg-color, #0f172a)',
        borderBottomColor: 'var(--header-border-color, rgba(255, 255, 255, 0.12))'
      }}
      className="text-white border-b shadow-md sticky top-0 z-30 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Store Info */}
          <div className="flex items-center gap-2.5 min-w-0 shrink">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-bold text-sm sm:text-base lg:text-lg leading-tight tracking-tight text-white truncate max-w-[140px] sm:max-w-[220px] lg:max-w-none">
                  {settings.storeName}
                </h1>
                <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  Caja Abierta
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden xl:block truncate">
                {settings.storeSlogan}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Clock - Visible on laptops and desktops (>= 1024px) to preserve tablet space */}
          <div className="hidden lg:flex items-center gap-2 lg:gap-3 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              title="Ver Dashboard de ventas y gráficas"
              style={{
                backgroundColor: 'var(--header-surface-color, rgba(255, 255, 255, 0.08))',
                borderColor: 'var(--header-surface-border-color, rgba(255, 255, 255, 0.15))'
              }}
              className="hover:bg-white/15 border px-2.5 lg:px-3 py-1.5 rounded-lg flex items-center gap-1.5 lg:gap-2 cursor-pointer transition-all text-left group"
            >
              <CircleDollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-slate-300 block text-[10px] flex items-center gap-1">
                  <span>Ventas de Hoy</span>
                  <BarChart3 className="w-2.5 h-2.5 text-emerald-400 opacity-60" />
                </span>
                <span className="font-bold text-emerald-400 font-mono text-xs sm:text-sm">
                  ${todayTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </button>

            <div
              style={{
                backgroundColor: 'var(--header-surface-color, rgba(255, 255, 255, 0.08))',
                borderColor: 'var(--header-surface-border-color, rgba(255, 255, 255, 0.15))'
              }}
              className="border px-2.5 lg:px-3 py-1.5 rounded-lg text-right"
            >
              <span className="text-slate-400 block text-[10px]">Turno #{cashShift.id.slice(-4)}</span>
              <span className="font-mono text-slate-200 font-medium text-xs">{currentTime}</span>
            </div>
          </div>

          {/* Network, Google Sheets, Settings & Sound Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Online / Offline status badge */}
            {isOnline ? (
              <span
                className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                title="Conectado a internet"
              >
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>En línea</span>
              </span>
            ) : (
              <span
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80 animate-pulse"
                title="Sin conexión a internet. Las ventas se guardan en IndexedDB localmente."
              >
                <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Offline</span>
              </span>
            )}

            {/* Pending sync counter & quick retry button */}
            {pendingSyncCount > 0 && (
              <button
                type="button"
                id="header-btn-retry-sync"
                onClick={() => syncPendingOfflineSales()}
                disabled={isSyncingSheets || !isOnline}
                title={
                  !isOnline
                    ? `${pendingSyncCount} venta(s) guardadas en IndexedDB pendientes de sincronizar con Google Sheets.`
                    : `${pendingSyncCount} venta(s) en cola local. Clic para reintentar sincronización con Google Sheets.`
                }
                className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all border shadow-xs cursor-pointer ${
                  !isOnline
                    ? 'bg-amber-950/70 text-amber-300 border-amber-800/70'
                    : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/40 shadow-amber-900/30'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                <span className="font-mono">{pendingSyncCount}</span>
                <span className="hidden xl:inline">
                  {isSyncingSheets ? 'Sincronizando...' : 'por sincronizar'}
                </span>
              </button>
            )}

            {/* User Session & Auth Pill Button */}
            {currentUser ? (
              <button
                type="button"
                id="header-btn-user-profile"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                title={`Sesión activa: ${currentUser.name} (${currentUser.role === 'admin' ? 'Administrador' : 'Cajero'}). Clic para cambiar de usuario o registrar personal.`}
                style={{
                  backgroundColor: 'var(--header-surface-color, rgba(255, 255, 255, 0.08))',
                  borderColor: 'var(--header-surface-border-color, rgba(255, 255, 255, 0.15))'
                }}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-white/15 border text-white transition-all cursor-pointer shadow-xs max-w-[130px] sm:max-w-[170px] lg:max-w-[210px]"
              >
                <span className="text-base shrink-0">{currentUser.emoji || '👤'}</span>
                <div className="text-left truncate">
                  <span className="text-xs font-bold leading-tight block truncate">
                    {currentUser.name}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1 py-0.2 rounded-xs leading-none inline-block ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-900/80 text-purple-200'
                        : 'bg-blue-900/80 text-blue-200'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'Admin' : 'Cajero'}
                  </span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                id="header-btn-login-prompt"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer animate-pulse"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Acceder</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                updateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
              }
              title={settings.soundEnabled ? 'Sonidos activados' : 'Sonidos silenciados'}
              className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 transition-colors border border-transparent hover:border-white/20"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              )}
            </button>

            <button
              type="button"
              onClick={handleSettingsClick}
              title={settings.kioskMode ? 'Configuración (Bloqueado por PIN en Modo Kiosco)' : 'Configuración de la tienda'}
              className={`p-2 rounded-lg transition-colors border ${
                settings.kioskMode
                  ? 'text-indigo-300 bg-indigo-950/60 border-indigo-700/60 hover:bg-indigo-900/80 hover:text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/15 border-transparent hover:border-white/20'
              }`}
            >
              {settings.kioskMode ? (
                <Lock className="w-5 h-5 text-indigo-400" />
              ) : (
                <Settings className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{ borderColor: 'var(--header-border-color, rgba(255, 255, 255, 0.12))' }}
          className="flex items-center overflow-x-auto no-scrollbar gap-1 border-t py-1.5"
        >
          <button
            type="button"
            id="tab-btn-caja"
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/15'
            }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>Caja / Venta</span>
            {cartTotalCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-emerald-800">
                {cartTotalCount}
              </span>
            )}
            <kbd className="hidden lg:inline-block ml-1 text-[10px] font-mono opacity-60 bg-black/30 px-1 rounded">
              F1
            </kbd>
          </button>

          {!settings.kioskMode && (
            <>
              <button
                type="button"
                id="tab-btn-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                id="tab-btn-inventario"
                onClick={() => setActiveTab('inventario')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'inventario'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                <Boxes className="w-4 h-4 shrink-0" />
                <span>Inventario</span>
                <kbd className="hidden lg:inline-block ml-1 text-[10px] font-mono opacity-60 bg-black/30 px-1 rounded">
                  F3
                </kbd>
              </button>

              <button
                type="button"
                id="tab-btn-fiados"
                onClick={() => setActiveTab('fiados')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'fiados'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                <BookUser className="w-4 h-4 shrink-0" />
                <span><span className="hidden lg:inline">Libreta de </span>Fiados</span>
              </button>
            </>
          )}

          <button
            type="button"
            id="tab-btn-corte"
            onClick={() => setActiveTab('corte')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'corte'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/15'
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            <span>Corte de Caja</span>
          </button>

          {!settings.kioskMode && (
            <button
              type="button"
              id="tab-btn-historial"
              onClick={() => setActiveTab('historial')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'historial'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/15'
              }`}
            >
              <ReceiptText className="w-4 h-4 shrink-0" />
              <span>Historial</span>
            </button>
          )}

          {/* Kiosk Mode badge and unlock trigger in navigation */}
          {settings.kioskMode && (
            <div className="ml-auto flex items-center gap-2 pl-2">
              <span
                id="header-kiosk-badge"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-xs whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Modo Kiosco:</span> Cobro Rápido
              </span>
              <button
                type="button"
                id="header-exit-kiosk-btn"
                onClick={() => {
                  setPinInput('');
                  setPinError('');
                  setIsUnlockModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-600 transition-colors cursor-pointer whitespace-nowrap"
                title="Desbloquear o salir del Modo Kiosco"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span>Salir Kiosco</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Kiosk Mode PIN Unlock Modal */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-indigo-950 text-white p-4 flex items-center justify-between border-b border-indigo-900">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-sm">Desbloquear Modo Kiosco</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(false)}
                className="text-indigo-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ingresa el PIN de seguridad de administrador para salir del modo kiosco o ingresar a la configuración (PIN predeterminado: <strong>1234</strong>).
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  PIN de Seguridad:
                </label>
                <div className="relative">
                  <input
                    type={showUnlockPin ? 'text' : 'password'}
                    maxLength={6}
                    autoFocus
                    placeholder="1234"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleVerifyPin('exit');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-center font-mono font-bold tracking-widest text-base text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPin(!showUnlockPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    title={showUnlockPin ? 'Ocultar PIN' : 'Ver PIN'}
                  >
                    {showUnlockPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-xs font-semibold text-rose-500 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {pinError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  id="btn-confirm-exit-kiosk"
                  onClick={() => handleVerifyPin('exit')}
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Salir Kiosco</span>
                </button>
                <button
                  type="button"
                  id="btn-open-settings-with-pin"
                  onClick={() => handleVerifyPin('settings')}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span>Abrir Ajustes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
