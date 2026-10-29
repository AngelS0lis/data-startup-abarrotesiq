import React, { useState } from 'react';
import {
  Settings,
  X,
  Check,
  Download,
  Upload,
  RefreshCw,
  Store,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  Printer,
  ShieldAlert,
  Monitor,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Contrast,
  QrCode,
  AlertTriangle,
  Palette
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { StoreSettings } from '../types';
import { soundEffects } from '../utils/audio';
import { THEME_COLOR_PRESETS, HEADER_COLOR_PRESETS, getHeaderColorHex } from '../utils/themeColors';

interface SettingsModalProps {
  onClose: () => void;
  onOpenGoogleSheets?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onOpenGoogleSheets }) => {
  const {
    settings,
    updateSettings,
    resetAllData,
    products,
    sales,
    customers,
    cashShift,
    theme,
    setTheme,
    primaryColor,
    setPrimaryColor,
    headerBgColor,
    setHeaderBgColor,
    highContrast,
    toggleHighContrast,
    pendingSyncCount
  } = usePOS();

  const [formData, setFormData] = useState<StoreSettings>({
    ...settings,
    theme: settings.theme || theme,
    primaryColor: settings.primaryColor || primaryColor || 'emerald',
    headerBgColor: settings.headerBgColor || headerBgColor || 'slate-900',
    highContrast: typeof settings.highContrast === 'boolean' ? settings.highContrast : highContrast
  });
  const [importStatus, setImportStatus] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    onClose();
  };

  // Export full JSON backup
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: formData,
      products,
      sales,
      customers,
      cashShift
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo_abarrotes_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.products && Array.isArray(parsed.products)) {
          localStorage.setItem('pos_abarrotes_products_v1', JSON.stringify(parsed.products));
        }
        if (parsed.sales && Array.isArray(parsed.sales)) {
          localStorage.setItem('pos_abarrotes_sales_v1', JSON.stringify(parsed.sales));
        }
        if (parsed.customers && Array.isArray(parsed.customers)) {
          localStorage.setItem('pos_abarrotes_customers_v1', JSON.stringify(parsed.customers));
        }
        if (parsed.shift) {
          localStorage.setItem('pos_abarrotes_shift_v1', JSON.stringify(parsed.shift));
        }
        if (parsed.settings) {
          localStorage.setItem('pos_abarrotes_settings_v1', JSON.stringify(parsed.settings));
        }
        setImportStatus('¡Respaldo importado correctamente! Recargando datos...');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch {
        setImportStatus('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div
          style={{ backgroundColor: 'var(--header-bg-color, #0f172a)' }}
          className="text-white px-5 py-4 flex items-center justify-between transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="font-extrabold text-base">Configuración de la Tiendita</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Store Info Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Datos para el Ticket y Membrete
            </span>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Tienda de Abarrotes:
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Eslogan / Giro:
              </label>
              <input
                type="text"
                value={formData.storeSlogan}
                onChange={(e) => setFormData({ ...formData, storeSlogan: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección:</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mensaje al pie del ticket térmico:
              </label>
              <input
                type="text"
                value={formData.ticketFooter}
                onChange={(e) => setFormData({ ...formData, ticketFooter: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            {/* Thermal Printer Settings */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  Impresora Térmica de Tickets
                </span>
              </div>

              {/* Auto print toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-700 block">
                    Imprimir ticket automáticamente
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Abre el diálogo de impresión al finalizar cada venta
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoPrintReceipt ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, autoPrintReceipt: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {/* Paper width selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ancho de papel de la impresora:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, ticketPaperWidth: '80mm' })
                    }
                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-bold transition-all ${
                      (formData.ticketPaperWidth || '80mm') === '80mm'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    80mm (Estándar Punto de Venta)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, ticketPaperWidth: '58mm' })
                    }
                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-bold transition-all ${
                      formData.ticketPaperWidth === '58mm'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    58mm (Portátil Mini / Bluetooth)
                  </button>
                </div>
              </div>

              {/* Barcode toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <div>
                  <span className="text-xs font-medium text-slate-700 block">
                    Código de barras en ticket
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Imprime código escaneable con el número de folio
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showBarcodeOnTicket ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, showBarcodeOnTicket: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {/* QR Code toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-start gap-2">
                  <QrCode className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-slate-700 block">
                      Código QR de contacto en ticket
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Imprime código QR al final del ticket para atención y pedidos
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showQrOnTicket ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, showQrOnTicket: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {/* Contact Link / WhatsApp input */}
              {(formData.showQrOnTicket ?? true) && (
                <div className="pt-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Enlace de contacto para el QR (WhatsApp o Web):
                  </label>
                  <input
                    type="text"
                    value={formData.contactUrl || ''}
                    placeholder="https://wa.me/525555551234 o link de tienda"
                    onChange={(e) =>
                      setFormData({ ...formData, contactUrl: e.target.value })
                    }
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Si se deja vacío, se genera automáticamente con el número de teléfono configurado arriba.
                  </p>
                </div>
              )}
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                {formData.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Sonidos de cobro y lector
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Emite beeps de escáner y sonido de caja registradora
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.soundEnabled}
                onChange={(e) => {
                  setFormData({ ...formData, soundEnabled: e.target.checked });
                  if (e.target.checked) soundEffects.cashSuccess();
                }}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Control de Inventario y Alertas de Resurtido */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Control de Inventario y Alertas de Resurtido
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Notificaciones y umbrales para prevenir el desabasto
                  </span>
                </div>
              </div>

              {/* Toggle alert on POS open */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <div>
                  <span className="text-xs font-medium text-slate-700 block">
                    Notificar productos con bajo inventario al abrir ventas (POS)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Muestra un aviso con los artículos críticos y botones de resurtido rápido
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="settings-low-stock-alert-toggle"
                  checked={formData.lowStockAlertEnabled ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, lowStockAlertEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Default threshold input */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label
                      htmlFor="settings-default-min-stock"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Umbral mínimo por defecto (piezas / kg):
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Se aplica a productos sin umbral específico en su ficha
                    </span>
                  </div>
                  <input
                    type="number"
                    id="settings-default-min-stock"
                    min="1"
                    max="999"
                    value={formData.defaultMinStockThreshold ?? 5}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultMinStockThreshold: Math.max(1, parseInt(e.target.value, 10) || 5)
                      })
                    }
                    className="w-20 p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>

            {/* Apariencia y Visualización: Modo Claro / Oscuro y Alto Contraste */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Apariencia y Visualización
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Configura el tema visual y el contraste para la pantalla de mostrador
                  </span>
                </div>
              </div>

              {/* Selector Modo Claro / Modo Oscuro */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tema de la Interfaz:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="settings-theme-light-btn"
                    onClick={() => {
                      setFormData({ ...formData, theme: 'light' });
                      setTheme('light');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      (formData.theme ?? theme) === 'light'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-900 font-extrabold shadow-xs ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Modo Claro (Día)</span>
                  </button>

                  <button
                    type="button"
                    id="settings-theme-dark-btn"
                    onClick={() => {
                      setFormData({ ...formData, theme: 'dark' });
                      setTheme('dark');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      (formData.theme ?? theme) === 'dark'
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-900 font-extrabold shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>Modo Oscuro (Noche)</span>
                  </button>
                </div>
              </div>

              {/* Selector de Color de la Página (Acento Principal) */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-slate-700 shrink-0" />
                    <label className="text-xs font-bold text-slate-800">
                      Color de la Página / Tienda:
                    </label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {THEME_COLOR_PRESETS.find((p) => p.id === (formData.primaryColor || primaryColor))?.name || 'Personalizado'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                  Cambia el color verde actual del sistema (botones, encabezados, pestañas y badges activos) por el color que mejor identifique a tu negocio.
                </p>

                {/* Paletas Predeterminadas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 mb-2.5">
                  {THEME_COLOR_PRESETS.map((preset) => {
                    const isSelected = (formData.primaryColor || primaryColor) === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        id={`settings-color-preset-${preset.id}`}
                        onClick={() => {
                          setFormData({ ...formData, primaryColor: preset.id });
                          setPrimaryColor(preset.id);
                          soundEffects.click();
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-slate-800 ring-2 ring-slate-800/30 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white shadow-2xs"
                          style={{ backgroundColor: preset.primary }}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <div className="min-w-0">
                          <span className="block text-[11px] font-bold text-slate-800 leading-tight truncate">
                            {preset.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selector de Color Personalizado Libre */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="settings-custom-color-picker"
                      value={
                        (formData.primaryColor || primaryColor).startsWith('#')
                          ? formData.primaryColor || primaryColor
                          : (THEME_COLOR_PRESETS.find((p) => p.id === (formData.primaryColor || primaryColor))?.primary || '#059669')
                      }
                      onChange={(e) => {
                        const hex = e.target.value;
                        setFormData({ ...formData, primaryColor: hex });
                        setPrimaryColor(hex);
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white overflow-hidden"
                      title="Seleccionar color personalizado libre"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Color Libre Personalizado
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Elige en el selector espectral o escribe código HEX
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-slate-400">#</span>
                    <input
                      type="text"
                      maxLength={6}
                      id="settings-custom-color-hex-input"
                      placeholder="059669"
                      value={
                        (formData.primaryColor || primaryColor).startsWith('#')
                          ? (formData.primaryColor || primaryColor).replace('#', '')
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                        if (raw.length === 6 || raw.length === 3) {
                          const hex = `#${raw}`;
                          setFormData({ ...formData, primaryColor: hex });
                          setPrimaryColor(hex);
                        } else if (raw.length === 0) {
                          setFormData({ ...formData, primaryColor: 'emerald' });
                          setPrimaryColor('emerald');
                        }
                      }}
                      className="w-20 text-xs font-mono font-bold text-slate-800 uppercase px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Color de Fondo de la Barra Superior / Encabezado */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-slate-700 shrink-0" />
                    <label className="text-xs font-bold text-slate-800">
                      Color de Fondo Superior (Barra de Navegación / Encabezado):
                    </label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {HEADER_COLOR_PRESETS.find((p) => p.id === (formData.headerBgColor || headerBgColor))?.name || 'Personalizado'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                  Cambia el color de fondo de la barra superior fija (anteriormente azul marino oscuro) para que combine con el estilo de tu tienda.
                </p>

                {/* Paletas Predeterminadas para el Encabezado */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 mb-2.5">
                  {HEADER_COLOR_PRESETS.map((preset) => {
                    const isSelected = (formData.headerBgColor || headerBgColor) === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        id={`settings-header-preset-${preset.id}`}
                        onClick={() => {
                          setFormData({ ...formData, headerBgColor: preset.id });
                          setHeaderBgColor(preset.id);
                          soundEffects.click();
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-slate-800 ring-2 ring-slate-800/30 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white shadow-2xs border border-white/20"
                          style={{ backgroundColor: preset.hex }}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <div className="min-w-0">
                          <span className="block text-[11px] font-bold text-slate-800 leading-tight truncate">
                            {preset.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selector de Color Libre para el Encabezado */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="settings-custom-header-picker"
                      value={
                        (formData.headerBgColor || headerBgColor).startsWith('#')
                          ? formData.headerBgColor || headerBgColor
                          : getHeaderColorHex(formData.headerBgColor || headerBgColor || 'slate-900')
                      }
                      onChange={(e) => {
                        const hex = e.target.value;
                        setFormData({ ...formData, headerBgColor: hex });
                        setHeaderBgColor(hex);
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white overflow-hidden"
                      title="Seleccionar color de fondo superior libre"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Fondo Superior Libre
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Elige cualquier tonalidad espectral o escribe código HEX
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-slate-400">#</span>
                    <input
                      type="text"
                      maxLength={6}
                      id="settings-custom-header-hex-input"
                      placeholder="0F172A"
                      value={
                        (formData.headerBgColor || headerBgColor).startsWith('#')
                          ? (formData.headerBgColor || headerBgColor).replace('#', '')
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                        if (raw.length === 6 || raw.length === 3) {
                          const hex = `#${raw}`;
                          setFormData({ ...formData, headerBgColor: hex });
                          setHeaderBgColor(hex);
                        } else if (raw.length === 0) {
                          setFormData({ ...formData, headerBgColor: 'slate-900' });
                          setHeaderBgColor('slate-900');
                        }
                      }}
                      className="w-20 text-xs font-mono font-bold text-slate-800 uppercase px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Conmutador de Alto Contraste */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Contrast className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Modo Alto Contraste
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Refuerza bordes y tipografía para luz solar directa o pantallas con reflejo
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="settings-high-contrast-toggle"
                  checked={formData.highContrast ?? highContrast}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setFormData({ ...formData, highContrast: isChecked });
                    if (isChecked !== highContrast) {
                      toggleHighContrast();
                    }
                  }}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* High Sale Confirmation Setting */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Validación de Venta de Monto Elevado
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Previene errores de captura solicitando confirmación explícita
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="settings-high-sale-enabled"
                  checked={formData.requireHighSaleConfirmation ?? true}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requireHighSaleConfirmation: e.target.checked
                    })
                  }
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>

              {(formData.requireHighSaleConfirmation ?? true) && (
                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between gap-3">
                  <label
                    htmlFor="settings-high-sale-threshold"
                    className="text-xs font-medium text-slate-700"
                  >
                    Límite para solicitar confirmación ($ MXN):
                  </label>
                  <div className="relative w-36">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-500 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      id="settings-high-sale-threshold"
                      min="1"
                      step="50"
                      value={formData.highSaleThreshold ?? 1000}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          highSaleThreshold: Math.max(1, parseFloat(e.target.value) || 0)
                        })
                      }
                      className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modo Kiosco Section */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                formData.kioskMode
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      formData.kioskMode
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {formData.kioskMode ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Monitor className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                        Modo Kiosco (Solo Cobro Rápido)
                      </span>
                      {formData.kioskMode && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200">
                          Activo
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Oculta inventario y fiados, restringiendo la interfaz solo al cobro
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="settings-kiosk-mode-toggle"
                  checked={formData.kioskMode ?? false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kioskMode: e.target.checked
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              {formData.kioskMode && (
                <div className="mt-3 pt-3 border-t border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5 text-xs text-indigo-950 dark:text-indigo-200 animate-in fade-in">
                  <p className="text-[11px] leading-relaxed">
                    🔒 <strong>Seguridad en mostrador:</strong> Se ocultan del menú las opciones de{' '}
                    <strong>Inventario</strong> y <strong>Libreta de Fiados</strong>. La interfaz se
                    restringe al proceso de cobro ágil para que los cajeros no modifiquen existencias ni
                    cuentas por cobrar.
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-700 dark:text-slate-200">
                          PIN de Desbloqueo / Salida:
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Código para abrir ajustes o salir de kiosco (ej. 1234)
                        </span>
                      </div>
                    </div>
                    <div className="relative w-28">
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={6}
                        placeholder="1234"
                        value={formData.kioskPin ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kioskPin: e.target.value
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-center tracking-widest text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute inset-y-0 right-0 pr-1.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        title={showPin ? 'Ocultar PIN' : 'Ver PIN'}
                      >
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              Guardar Configuración
            </button>
          </form>

          {/* Google Sheets Cloud Synchronization Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Sincronización en la Nube
            </span>

            <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      Google Sheets
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sincroniza y respalda tus ventas, catálogo e inventario en vivo
                    </span>
                  </div>
                </div>

                {onOpenGoogleSheets && (
                  <button
                    type="button"
                    id="btn-settings-open-google-sheets"
                    onClick={() => {
                      onClose();
                      onOpenGoogleSheets();
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Sincronizar</span>
                  </button>
                )}
              </div>

              {pendingSyncCount > 0 && (
                <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 pt-1.5 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{pendingSyncCount} venta(s) pendientes de subir a tu hoja de cálculo</span>
                </div>
              )}
            </div>
          </div>

          {/* Backup and Restore Section */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Copia de Seguridad y Restauración
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Descargar Respaldo</span>
              </button>

              <label className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Subir Respaldo</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <p className="text-xs text-center font-bold text-emerald-700">{importStatus}</p>
            )}

            {/* Reset to sample data */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      '¿Restablecer todo a los datos iniciales de muestra (35 productos de abarrotes, clientes y catálogo precargado)?'
                    )
                  ) {
                    resetAllData();
                    onClose();
                  }
                }}
                className="w-full py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restablecer Datos de Muestra Originales</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
