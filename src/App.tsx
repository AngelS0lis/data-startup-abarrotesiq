import React, { useState, useEffect } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/Header';
import { POSView } from './components/POSView/POSView';
import { InventoryView } from './components/InventoryView/InventoryView';
import { FiadosView } from './components/FiadosView/FiadosView';
import { CashShiftView } from './components/CashShiftView/CashShiftView';
import { SalesHistoryView } from './components/SalesHistoryView/SalesHistoryView';
import { SalesDashboard } from './components/Dashboard/SalesDashboard';
import { SettingsModal } from './components/SettingsModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { AuthModal } from './components/AuthModal';
import { Keyboard, HelpCircle, WifiOff, RefreshCw, Lock } from 'lucide-react';

const POSAppContent: React.FC = () => {
  const {
    settings,
    activeTab,
    setActiveTab,
    isOnline,
    pendingSyncCount,
    isSyncingSheets,
    syncPendingOfflineSales,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode
  } = usePOS();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState<boolean>(false);

  // Enforce tab restriction in Kiosk Mode
  useEffect(() => {
    if (settings.kioskMode && (activeTab === 'inventario' || activeTab === 'fiados' || activeTab === 'dashboard' || activeTab === 'historial')) {
      setActiveTab('pos');
    }
  }, [settings.kioskMode, activeTab, setActiveTab]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ctrl + B or Cmd + B -> Switch to POS view and focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setActiveTab('pos');
      }
      // F1 -> Switch to POS view
      else if (e.key === 'F1') {
        setActiveTab('pos');
      }
      // F3 -> Switch to Inventory (disabled in Kiosk Mode)
      else if (e.key === 'F3') {
        e.preventDefault();
        if (!settings.kioskMode) {
          setActiveTab('inventario');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [setActiveTab, settings.kioskMode]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
      />

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs z-20">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              Modo sin conexión: Las transacciones se guardan en tu navegador con IndexedDB.
            </span>
          </div>
          <span className="text-[11px] font-semibold opacity-90 hidden md:inline">
            Se sincronizarán automáticamente con Google Sheets cuando vuelva internet.
          </span>
        </div>
      )}

      {/* Pending Sync Alert Strip when Online */}
      {isOnline && pendingSyncCount > 0 && (
        <div className="bg-emerald-800 text-emerald-100 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs z-20">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>
              {pendingSyncCount} venta(s) guardadas localmente pendientes de sincronizar con Google Sheets.
            </span>
          </div>
          <button
            type="button"
            onClick={() => syncPendingOfflineSales()}
            disabled={isSyncingSheets}
            className="px-2.5 py-0.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold border border-emerald-500/40 cursor-pointer transition-colors shadow-2xs"
          >
            {isSyncingSheets ? 'Sincronizando...' : 'Sincronizar ahora'}
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-14">
        {activeTab === 'pos' && <POSView />}
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
            <SalesDashboard onBackToPOS={() => setActiveTab('pos')} />
          </div>
        )}
        {activeTab === 'inventario' && (
          <InventoryView onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)} />
        )}
        {activeTab === 'fiados' && <FiadosView />}
        {activeTab === 'corte' && <CashShiftView />}
        {activeTab === 'historial' && <SalesHistoryView />}
      </main>

      {/* Bottom Sticky Cashier Keyboard Shortcuts Helper */}
      <footer
        id="pos-shortcuts-footer"
        style={{
          backgroundColor: 'var(--header-bg-color, #0f172a)',
          borderTopColor: 'var(--header-border-color, rgba(255, 255, 255, 0.12))'
        }}
        className="fixed bottom-0 left-0 right-0 text-slate-200 border-t py-1.5 px-3 sm:px-4 text-[10px] sm:text-[11px] font-mono z-20 hidden sm:flex items-center justify-between transition-colors duration-200 overflow-x-auto no-scrollbar"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 shrink-0">
          <span className="flex items-center gap-1 text-slate-300 font-sans font-bold">
            <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Atajos de teclado:</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd
              style={{
                backgroundColor: 'var(--header-surface-color, rgba(255, 255, 255, 0.12))',
                borderColor: 'var(--header-surface-border-color, rgba(255, 255, 255, 0.2))'
              }}
              className="border px-1.5 py-0.5 rounded text-white font-bold"
            >
              F1
            </kbd>
            <span>Buscar / Escáner</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd
              style={{
                backgroundColor: 'var(--header-surface-color, rgba(255, 255, 255, 0.12))',
                borderColor: 'var(--header-surface-border-color, rgba(255, 255, 255, 0.2))'
              }}
              className="border px-1.5 py-0.5 rounded text-white font-bold"
            >
              F2
            </kbd>
            <span>Cobrar</span>
          </span>
          {!settings.kioskMode ? (
            <span className="flex items-center gap-1">
              <kbd
                style={{
                  backgroundColor: 'var(--header-surface-color, rgba(255, 255, 255, 0.12))',
                  borderColor: 'var(--header-surface-border-color, rgba(255, 255, 255, 0.2))'
                }}
                className="border px-1.5 py-0.5 rounded text-white font-bold"
              >
                F3
              </kbd>
              <span>Inventario</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-indigo-300 font-sans font-bold bg-indigo-950/80 border border-indigo-700/60 px-2 py-0.5 rounded">
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>Modo Kiosco Activo</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <kbd
              style={{
                backgroundColor: 'var(--header-surface-color, rgba(255, 255, 255, 0.12))',
                borderColor: 'var(--header-surface-border-color, rgba(255, 255, 255, 0.2))'
              }}
              className="border px-1.5 py-0.5 rounded text-white font-bold"
            >
              F4
            </kbd>
            <span>Granel / Báscula</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd
              style={{
                backgroundColor: 'var(--header-surface-color, rgba(255, 255, 255, 0.12))',
                borderColor: 'var(--header-surface-border-color, rgba(255, 255, 255, 0.2))'
              }}
              className="border px-1.5 py-0.5 rounded text-white font-bold"
            >
              Enter
            </kbd>
            <span>Confirmar / Agregar</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-slate-300 font-sans text-xs shrink-0 ml-2">
          <span>Punto de Venta Abarrotes v1.0</span>
        </div>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        />
      )}

      {/* Google Sheets Modal */}
      {isGoogleSheetsOpen && (
        <GoogleSheetsModal onClose={() => setIsGoogleSheetsOpen(false)} />
      )}

      {/* Auth Modal (Login / Register / User Switch) */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSAppContent />
    </POSProvider>
  );
}
