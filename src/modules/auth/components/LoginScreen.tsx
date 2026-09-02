import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import { Store, Lock, User, ArrowRight, Loader2, KeyRound, AlertCircle, Building2 } from 'lucide-react';
import { getTenantSlugFromPath, setTenantUrlPath } from '@/lib/tenantUrl';
import { toast } from 'sonner';

const PIN_LENGTH = 6;

export const LoginScreen: React.FC = () => {
  const {
    publicTenant,
    tenantSlug,
    isLoadingTenant,
    tenantError,
    fetchPublicTenant,
    setTenantSlug,
    login,
    pinLogin,
  } = useAuthStore();

  const [activeMode, setActiveMode] = useState<'pin' | 'credentials'>('pin');

  // Credentials Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [credentialsError, setCredentialsError] = useState('');
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);

  // PIN Form State
  const [pin, setPin] = useState('');
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [pinShake, setPinShake] = useState(false);

  // Tenant search / selector state for root /
  const [searchSlugInput, setSearchSlugInput] = useState('');
  const [isSearchingTenant, setIsSearchingTenant] = useState(false);

  // 1. Initial tenant resolution from URL pathname
  useEffect(() => {
    const slugFromUrl = getTenantSlugFromPath();
    if (slugFromUrl) {
      if (!publicTenant || publicTenant.slug !== slugFromUrl) {
        fetchPublicTenant(slugFromUrl);
      }
    } else if (tenantSlug && !publicTenant) {
      fetchPublicTenant(tenantSlug);
    }
  }, [publicTenant, tenantSlug, fetchPublicTenant]);

  // Handle PIN Submit
  const handlePinSubmit = useCallback(
    async (submittedPin: string) => {
      if (submittedPin.length < 4) return;
      setIsPinLoading(true);
      setPinError(false);

      const targetSlug = publicTenant?.slug || tenantSlug || undefined;
      const res = await pinLogin(submittedPin, targetSlug);
      setIsPinLoading(false);

      if (res === 'SUCCESS') {
        toast.success('¡Sesión iniciada con éxito!');
        return;
      }

      setPinError(true);
      setPinShake(true);
      setPin('');
      if (res === 'NOT_FOUND') {
        toast.error('Tienda no encontrada. Verifica la URL.');
      } else {
        toast.error('PIN incorrecto. Intenta de nuevo.');
      }
      setTimeout(() => setPinShake(false), 500);
    },
    [pinLogin, publicTenant, tenantSlug]
  );

  // Handle keypad clicks
  const handleKeyClick = useCallback(
    (digit: string) => {
      if (isPinLoading) return;
      setPinError(false);
      setPin((prev) => {
        const next = prev.length < PIN_LENGTH ? prev + digit : prev;
        if (next.length === PIN_LENGTH) {
          setTimeout(() => handlePinSubmit(next), 60);
        }
        return next;
      });
    },
    [isPinLoading, handlePinSubmit]
  );

  const handlePinDelete = useCallback(() => {
    if (isPinLoading) return;
    setPin((prev) => prev.slice(0, -1));
    setPinError(false);
  }, [isPinLoading]);

  // Keyboard listener for physical keypad
  useEffect(() => {
    if (activeMode !== 'pin') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyClick(e.key);
      } else if (e.key === 'Backspace') {
        handlePinDelete();
      } else if (e.key === 'Enter' && pin.length >= 4) {
        handlePinSubmit(pin);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMode, pin, handleKeyClick, handlePinDelete, handlePinSubmit]);

  // Handle Credentials Submit
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setCredentialsError('Por favor complete todos los campos.');
      return;
    }
    setCredentialsError('');
    setIsCredentialsLoading(true);
    try {
      const targetSlug = publicTenant?.slug || tenantSlug || undefined;
      const success = await login(identifier, password, 'store', targetSlug);
      if (!success) {
        setCredentialsError('Credenciales incorrectas o usuario no asignado a esta tienda.');
      } else {
        toast.success('¡Bienvenido al sistema!');
      }
    } catch (err) {
      setCredentialsError('Ocurrió un error en el inicio de sesión.');
    } finally {
      setIsCredentialsLoading(false);
    }
  };

  // Handle Tenant Switch / Manual Search
  const handleSelectTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = searchSlugInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!cleanSlug) {
      toast.warning('Ingresa el identificador de tu tienda');
      return;
    }
    setIsSearchingTenant(true);
    const ok = await fetchPublicTenant(cleanSlug);
    setIsSearchingTenant(false);
    if (ok) {
      setTenantUrlPath(cleanSlug);
      setSearchSlugInput('');
    } else {
      toast.error(`No se encontró la tienda "${cleanSlug}".`);
    }
  };

  const handleClearTenant = () => {
    setTenantSlug(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-4xl bg-bg-card border border-border-card rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 relative z-10">
        
        {/* Left Side Panel - Branding */}
        <div className="md:w-5/12 bg-linear-to-br from-primary/10 via-bg-dark to-bg-card p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border-card">
          <div>
            {/* Store Logo or App Badge */}
            <div className="flex items-center gap-3.5 mb-8">
              {publicTenant?.logoUrl ? (
                <div className="w-14 h-14 rounded-2xl bg-bg-card/80 border border-border-card p-1 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={publicTenant.logoUrl}
                    alt={publicTenant.name}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="bg-primary/20 border border-primary/30 p-3 rounded-2xl shadow-lg shadow-primary/20 shrink-0">
                  <Store className="w-7 h-7 text-primary" />
                </div>
              )}
              <div className="overflow-hidden">
                <span className="text-xl font-extrabold tracking-tight text-secondary truncate block">
                  {publicTenant ? publicTenant.name : 'POS STORE'}
                </span>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest block">
                  {publicTenant ? `Tienda: @${publicTenant.slug}` : 'SaaS ERP Multi-tenant'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-secondary leading-snug">
                {publicTenant
                  ? `Terminal de Cobro y Facturación`
                  : `Gestión inteligente de tu negocio en tiempo real.`}
              </h2>
              <p className="text-neutral text-xs leading-relaxed">
                {publicTenant
                  ? `Inicia sesión con tu código de cajero o credenciales para gestionar ventas, inventario y arqueos de turno.`
                  : `Control de inventarios por variantes, múltiples sucursales, compras y ventas en una sola plataforma.`}
              </p>
            </div>
          </div>

          {/* Bottom helper */}
          <div className="mt-8 pt-6 border-t border-border-card flex items-center justify-between text-xs text-neutral">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium">Terminal POS Lista</span>
            </div>
            {publicTenant && (
              <button
                type="button"
                onClick={handleClearTenant}
                className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
              >
                Cambiar Tienda
              </button>
            )}
          </div>
        </div>

        {/* Right Side Panel - Login Controls */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
          {/* If No Tenant Selected / Root Portal View */}
          {!publicTenant && !isLoadingTenant ? (
            <div className="space-y-6 max-w-md mx-auto w-full">
              <div>
                <h3 className="text-2xl font-black text-secondary tracking-tight">Acceso a tu Tienda</h3>
                <p className="text-xs text-neutral mt-1">
                  Ingresa el nombre o identificador de tu negocio para abrir la terminal.
                </p>
              </div>

              {tenantError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{tenantError}</span>
                </div>
              )}

              <form onSubmit={handleSelectTenantSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral mb-1.5">
                    Identificador de la Tienda (Slug)
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-neutral" />
                    <input
                      type="text"
                      value={searchSlugInput}
                      onChange={(e) => setSearchSlugInput(e.target.value)}
                      placeholder="ej: zapateria-gomez"
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 pl-10 pr-4 text-sm text-secondary placeholder-neutral focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSearchingTenant}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 cursor-pointer disabled:opacity-50"
                >
                  {isSearchingTenant ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Entrar a la Tienda</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : isLoadingTenant ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-neutral">Cargando tienda...</p>
            </div>
          ) : (
            /* Tenant Loaded: PIN / Credentials Tabs */
            <div className="space-y-5 max-w-sm mx-auto w-full">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-xl font-black text-secondary tracking-tight">
                  {activeMode === 'pin' ? 'Acceso Rápido de Cajero' : 'Acceso Administrativo'}
                </h3>
                <p className="text-xs text-neutral mt-0.5">
                  {activeMode === 'pin' ? 'Digita tu PIN de cajero para comenzar' : 'Ingresa tus credenciales autorizadas'}
                </p>
              </div>

              {/* Mode Switch Tabs */}
              <div className="flex bg-bg-dark p-1 rounded-xl border border-border-card">
                <button
                  type="button"
                  onClick={() => { setActiveMode('pin'); setPin(''); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeMode === 'pin'
                      ? 'bg-primary text-white shadow'
                      : 'text-neutral hover:text-secondary'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>PIN Cajero</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('credentials')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeMode === 'credentials'
                      ? 'bg-primary text-white shadow'
                      : 'text-neutral hover:text-secondary'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Usuario / Clave</span>
                </button>
              </div>

              {/* ── MODE A: FAST PIN KEYPAD ── */}
              {activeMode === 'pin' && (
                <div className="flex flex-col items-center gap-5 animate-fade-in">
                  {/* PIN Dots Display */}
                  <div
                    className={`flex gap-3 py-1 ${pinShake ? 'animate-bounce' : ''}`}
                  >
                    {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                      const filled = i < pin.length;
                      return (
                        <div
                          key={i}
                          className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                            pinError
                              ? 'border-rose-500 bg-rose-500/20'
                              : filled
                              ? 'border-primary bg-primary scale-110 shadow-sm shadow-primary/50'
                              : 'border-border-card bg-bg-dark'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Numpad Grid */}
                  <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
                    {numpadKeys.map((k, idx) => {
                      if (k === '') return <div key={idx} />;
                      const isClear = k === 'C';
                      const isBackspace = k === '⌫';

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isPinLoading}
                          onClick={() => {
                            if (isClear) setPin('');
                            else if (isBackspace) handlePinDelete();
                            else handleKeyClick(k);
                          }}
                          className={`h-12 rounded-2xl font-bold text-base transition-all duration-150 flex items-center justify-center cursor-pointer select-none active:scale-95 ${
                            isClear || isBackspace
                              ? 'bg-bg-dark border border-border-card text-neutral hover:text-secondary hover:border-primary/40'
                              : 'bg-bg-dark/80 hover:bg-bg-dark border border-border-card hover:border-primary/50 text-secondary text-lg shadow-sm'
                          }`}
                        >
                          {k}
                        </button>
                      );
                    })}
                  </div>

                  {pin.length >= 4 && (
                    <button
                      type="button"
                      disabled={isPinLoading}
                      onClick={() => handlePinSubmit(pin)}
                      className="w-full max-w-[260px] bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
                    >
                      {isPinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar al POS'}
                    </button>
                  )}
                </div>
              )}

              {/* ── MODE B: CREDENTIALS FORM ── */}
              {activeMode === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-4 animate-fade-in">
                  {credentialsError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
                      {credentialsError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral mb-1">
                      Usuario o Correo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="cajero1 o admin@tienda.com"
                        className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-10 pr-4 text-xs text-secondary placeholder-neutral focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-10 pr-4 text-xs text-secondary placeholder-neutral focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCredentialsLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isCredentialsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Acceder al Sistema</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
