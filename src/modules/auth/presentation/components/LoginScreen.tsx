import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../stores/useAuthStore';
import { useIsAuthenticated, useTenant, useUser } from '../hooks/useSession';
import { homeRouteFor } from '../../domain/rules/route-access';
import { KeyRound, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { BrandPanel } from './login/BrandPanel';
import { CredentialsForm } from './login/CredentialsForm';
import { PinPad } from './login/PinPad';
import { TenantSlugForm } from './login/TenantSlugForm';

const PIN_LENGTH = 6;

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isLoadingTenant, tenantError, fetchPublicTenant, clearTenant, login, pinLogin } = useAuthStore();
  const publicTenant = useTenant();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();

  const redirectToApp = useCallback(() => {
    navigate({
      to: homeRouteFor(useAuthStore.getState().user),
      replace: true,
    });
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      redirectToApp();
    }
  }, [isAuthenticated, user, redirectToApp]);

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
  const isSubmittingPinRef = useRef(false);

  // Tenant search / selector state for root /
  const [searchSlugInput, setSearchSlugInput] = useState('');
  const [isSearchingTenant, setIsSearchingTenant] = useState(false);

  // Handle PIN Submit
  const handlePinSubmit = useCallback(
    async (submittedPin: string) => {
      if (submittedPin.length < 4 || isSubmittingPinRef.current) return;
      isSubmittingPinRef.current = true;
      setIsPinLoading(true);
      setPinError(false);

      try {
        const targetSlug = publicTenant?.slug;
        const res = await pinLogin(submittedPin, targetSlug);

        if (res.ok) {
          toast.success('¡Sesión iniciada con éxito!');
          redirectToApp();
          return;
        }

        setPinError(true);
        setPinShake(true);
        setPin('');
        // El mensaje depende del motivo real: PIN incorrecto, demasiados intentos, usuario deshabilitado, sin conexión…
        toast.error(res.message);
        setTimeout(() => setPinShake(false), 500);
      } finally {
        setIsPinLoading(false);
        isSubmittingPinRef.current = false;
      }
    },
    [pinLogin, publicTenant]
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
      const targetSlug = publicTenant?.slug;
      const result = await login(identifier, password, targetSlug);
      if (!result.ok) {
        setCredentialsError(result.message);
      } else {
        toast.success('¡Bienvenido al sistema!');
        redirectToApp();
      }
    } catch {
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
      setSearchSlugInput('');
      navigate({ to: '/login/$tenantSlug', params: { tenantSlug: cleanSlug } });
    } else {
      toast.error(`No se encontró la tienda "${cleanSlug}".`);
    }
  };

  const handleClearTenant = () => {
    clearTenant();
    setSearchSlugInput('');
    navigate({ to: '/login', replace: true });
  };

  const tabClass = (active: boolean) =>
    `flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg text-[13px] font-semibold outline-none transition-all focus-visible:ring-4 focus-visible:ring-primary/15 ${
      active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-secondary'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-bg-dark lg:flex-row">
      <BrandPanel tenant={publicTenant} onChangeTenant={handleClearTenant} />

      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        {!publicTenant && !isLoadingTenant ? (
          <TenantSlugForm value={searchSlugInput} onChange={setSearchSlugInput} onSubmit={handleSelectTenantSubmit} isSearching={isSearchingTenant} error={tenantError} />
        ) : isLoadingTenant ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando tienda…</p>
          </div>
        ) : (
          <div className="w-full max-w-sm animate-fade-up space-y-7">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-secondary">{activeMode === 'pin' ? 'Acceso rápido de cajero' : 'Acceso administrativo'}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{activeMode === 'pin' ? 'Digita tu PIN de cajero para comenzar' : 'Ingresa tus credenciales autorizadas'}</p>
            </div>

            <div role="tablist" aria-label="Forma de acceso" className="flex rounded-xl border border-border bg-muted/60 p-1">
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'pin'}
                onClick={() => {
                  setActiveMode('pin');
                  setPin('');
                }}
                className={tabClass(activeMode === 'pin')}
              >
                <KeyRound className="size-4" />
                PIN Cajero
              </button>
              <button type="button" role="tab" aria-selected={activeMode === 'credentials'} onClick={() => setActiveMode('credentials')} className={tabClass(activeMode === 'credentials')}>
                <User className="size-4" />
                Usuario / Clave
              </button>
            </div>

            {activeMode === 'pin' ? (
              <PinPad
                pin={pin}
                length={PIN_LENGTH}
                isLoading={isPinLoading}
                hasError={pinError}
                shake={pinShake}
                onDigit={handleKeyClick}
                onDelete={handlePinDelete}
                onClear={() => setPin('')}
                onSubmit={() => handlePinSubmit(pin)}
              />
            ) : (
              <CredentialsForm
                identifier={identifier}
                password={password}
                error={credentialsError}
                isLoading={isCredentialsLoading}
                onIdentifierChange={setIdentifier}
                onPasswordChange={setPassword}
                onSubmit={handleCredentialsSubmit}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
