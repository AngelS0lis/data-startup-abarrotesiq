import React, { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  ShieldCheck,
  KeyRound,
  UserPlus,
  LogIn,
  LogOut,
  Users,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { User, UserRole } from '../types';
import { soundEffects } from '../utils/audio';

const AVATAR_OPTIONS = ['👨‍💼', '👩‍💼', '🧑‍💼', '🧔', '🧕', '🏪', '🛒', '📦', '⭐', '🥑', '🍞', '🥤'];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'switch' | 'manage';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const {
    currentUser,
    users,
    login,
    register,
    logout,
    switchUser,
    deleteUser,
    settings
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'manage'>(
    initialMode === 'register' ? 'register' : initialMode === 'manage' ? 'manage' : 'login'
  );

  // Login form state
  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser?.id || (users.length > 0 ? users[0].id : '')
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [manualUsername, setManualUsername] = useState<string>('');
  const [useManualInput, setUseManualInput] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  // Register form state
  const [regName, setRegName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('cashier');
  const [regPin, setRegPin] = useState<string>('');
  const [regEmoji, setRegEmoji] = useState<string>('🧑‍💼');
  const [regPhone, setRegPhone] = useState<string>('');
  const [showRegPin, setShowRegPin] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string>('');
  const [registerSuccess, setRegisterSuccess] = useState<string>('');

  // Manage users state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    let result: { success: boolean; error?: string };

    if (useManualInput) {
      if (!manualUsername.trim()) {
        setLoginError('Ingresa tu nombre de usuario.');
        return;
      }
      result = login(manualUsername.trim(), pinInput);
    } else {
      if (!selectedUserId) {
        setLoginError('Selecciona un usuario.');
        return;
      }
      result = switchUser(selectedUserId, pinInput);
    }

    if (result.success) {
      if (settings.soundEnabled) soundEffects.cashSuccess();
      setPinInput('');
      onClose();
    } else {
      if (settings.soundEnabled) soundEffects.error();
      setLoginError(result.error || 'Credenciales incorrectas');
    }
  };

  const handleQuickDemoLogin = (username: string, pin: string) => {
    setLoginError('');
    const res = login(username, pin);
    if (res.success) {
      if (settings.soundEnabled) soundEffects.cashSuccess();
      setPinInput('');
      onClose();
    } else {
      setLoginError(res.error || 'Error al iniciar');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    const res = register({
      name: regName,
      username: regUsername,
      role: regRole,
      pin: regPin,
      emoji: regEmoji,
      phone: regPhone
    });

    if (res.success) {
      if (settings.soundEnabled) soundEffects.cashSuccess();
      setRegisterSuccess(`¡Usuario "${regName}" registrado y autenticado correctamente!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      if (settings.soundEnabled) soundEffects.error();
      setRegisterError(res.error || 'Error al registrar el usuario');
    }
  };

  const handleDeleteUser = (userId: string) => {
    const res = deleteUser(userId);
    if (!res.success) {
      if (settings.soundEnabled) soundEffects.error();
      alert(res.error);
    } else {
      setDeleteConfirmId(null);
      if (settings.soundEnabled) soundEffects.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div
        id="auth-modal-container"
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div
          style={{ backgroundColor: 'var(--header-bg-color, #0f172a)' }}
          className="text-white px-5 py-4 flex items-center justify-between border-b border-white/10 transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg leading-tight flex items-center gap-2">
                <span>Acceso y Registro de Personal</span>
              </h2>
              <p className="text-xs text-slate-400">
                Control de sesiones, cajeros y permisos en mostrador
              </p>
            </div>
          </div>

          {currentUser && (
            <button
              type="button"
              id="auth-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current Active Session Pill Bar */}
        {currentUser ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/80 px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">{currentUser.emoji || '👤'}</span>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentUser.name}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'Administrador' : 'Cajero'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                  @{currentUser.username} • Sesión activa
                </span>
              </div>
            </div>

            <button
              type="button"
              id="auth-btn-logout-session"
              onClick={() => {
                logout();
                setActiveTab('login');
              }}
              className="px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/80 rounded-lg border border-rose-200 dark:border-rose-900 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Cerrar sesión actual"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/80 px-4 py-2 text-xs font-medium text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Debes iniciar sesión para operar el mostrador y registrar transacciones.</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1.5 gap-1">
          <button
            type="button"
            id="auth-tab-btn-login"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4 text-emerald-600" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            id="auth-tab-btn-register"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Registrar Usuario</span>
          </button>

          <button
            type="button"
            id="auth-tab-btn-manage"
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Personal ({users.length})</span>
          </button>
        </div>

        {/* Tab 1: INICIAR SESIÓN */}
        {activeTab === 'login' && (
          <div className="p-4 sm:p-6 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Quick Profile Cards */}
            {!useManualInput ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Selecciona tu cuenta de cajero / administrador:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {users.map((user) => {
                    const isSelected = selectedUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setLoginError('');
                          setPinInput('');
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className="text-3xl mb-1">{user.emoji || '👤'}</span>
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 text-center line-clamp-1">
                          {user.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          @{user.username}
                        </span>
                        <span
                          className={`mt-1 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Cajero'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre de usuario:
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    id="auth-input-manual-username"
                    value={manualUsername}
                    onChange={(e) => setManualUsername(e.target.value)}
                    placeholder="Ej. admin, maria, carlos"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* PIN / Password Input */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    PIN de Acceso o Contraseña:
                  </label>
                  {!useManualInput && selectedUser && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Usuario seleccionado: <strong className="text-slate-700 dark:text-slate-200">{selectedUser.name}</strong>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    id="auth-input-pin"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Ingresa tu PIN (ej. 1234)"
                    autoFocus
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono tracking-widest font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUseManualInput(!useManualInput);
                    setLoginError('');
                  }}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  {useManualInput ? '← Ver lista de cajeros' : 'Escribir usuario manualmente'}
                </button>
              </div>

              <button
                type="submit"
                id="auth-btn-submit-login"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Ingresar al Punto de Venta</span>
              </button>
            </form>

            {/* Quick Demo Fill Buttons for Testing */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Acceso Rápido de Prueba (1 Clic):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="auth-btn-demo-admin"
                  onClick={() => handleQuickDemoLogin('admin', '1234')}
                  className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                >
                  <span className="text-base">👨‍💼</span>
                  <div className="truncate">
                    <span className="block font-bold truncate">Don Pancho</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">Admin (1234)</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="auth-btn-demo-cashier"
                  onClick={() => handleQuickDemoLogin('maria', '2222')}
                  className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                >
                  <span className="text-base">👩‍💼</span>
                  <div className="truncate">
                    <span className="block font-bold truncate">María Gómez</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Cajera (2222)</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: REGISTRAR NUEVO USUARIO */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-4 sm:p-6 space-y-4">
            {registerError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{registerError}</span>
              </div>
            )}

            {registerSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{registerSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo *:
                </label>
                <input
                  type="text"
                  id="reg-input-name"
                  required
                  placeholder="Ej. Roberto Martínez"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de Usuario (Login) *:
                </label>
                <input
                  type="text"
                  id="reg-input-username"
                  required
                  placeholder="Ej. roberto, cajero3"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Rol y Nivel de Acceso *:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="reg-role-cashier"
                  onClick={() => {
                    setRegRole('cashier');
                    if (regEmoji === '👨‍💼') setRegEmoji('🧑‍💼');
                  }}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    regRole === 'cashier'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-600 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-2xl shrink-0">🧑‍💼</span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      Cajero / Mostrador
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-snug">
                      Ventas rápidas, cobro, escaneo y libreta de fiados.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  id="reg-role-admin"
                  onClick={() => {
                    setRegRole('admin');
                    if (regEmoji === '🧑‍💼') setRegEmoji('👨‍💼');
                  }}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    regRole === 'admin'
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 dark:border-purple-600 ring-2 ring-purple-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-2xl shrink-0">👨‍💼</span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      Administrador / Dueño
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-snug">
                      Acceso total a ajustes, inventario, reportes y finanzas.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* PIN & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  PIN de Acceso (mínimo 4 dígitos) *:
                </label>
                <div className="relative">
                  <input
                    type={showRegPin ? 'text' : 'password'}
                    id="reg-input-pin"
                    required
                    minLength={4}
                    maxLength={12}
                    placeholder="Ej. 5678"
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono tracking-widest font-bold focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPin(!showRegPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono (opcional):
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    id="reg-input-phone"
                    placeholder="Ej. 55 1234 5678"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Avatar del Personal:
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setRegEmoji(emoji)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer shrink-0 ${
                      regEmoji === emoji
                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 scale-110 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="reg-btn-submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-900/20 transition-all cursor-pointer mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Usuario y Entrar</span>
            </button>
          </form>
        )}

        {/* Tab 3: GESTIÓN DE PERSONAL */}
        {activeTab === 'manage' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Directorio de Personal Registrado
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {users.length} usuarios con acceso al sistema
                </p>
              </div>

              <button
                type="button"
                id="manage-btn-new-user"
                onClick={() => setActiveTab('register')}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nuevo Usuario</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto pr-1">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                const isDeleting = deleteConfirmId === u.id;

                return (
                  <div
                    key={u.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                        {u.emoji || '👤'}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                            {u.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded-md">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>@{u.username}</span>
                          <span>•</span>
                          <span className="capitalize">{u.role === 'admin' ? 'Administrador' : 'Cajero'}</span>
                          {u.lastLogin && (
                            <>
                              <span>•</span>
                              <span className="hidden sm:inline">Último: {u.lastLogin.slice(5)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isCurrent ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setActiveTab('login');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                        >
                          Conmutar
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold px-2 py-1">En uso</span>
                      )}

                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="px-2 py-1 text-[11px] font-bold bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(u.id)}
                          title="Eliminar usuario"
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer / Note on Django & Security */}
        <div className="bg-slate-50 dark:bg-slate-900/80 px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Sesión local protegida por PIN y roles de mostrador.
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            Abarrotes Auth Engine v1.0
          </span>
        </div>
      </div>
    </div>
  );
};
