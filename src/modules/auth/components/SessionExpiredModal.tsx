import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCw, LogOut, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const COUNTDOWN_SECONDS = 10;

export const SessionExpiredModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    isSessionExpiredModalOpen,
    refreshSession,
    logout,
    tenantSlug,
    publicTenant,
  } = useAuthStore();

  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isExtending, setIsExtending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLogout = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const slug = tenantSlug || publicTenant?.slug;
    logout();
    if (slug) {
      navigate({ to: '/login/$tenantSlug', params: { tenantSlug: slug }, replace: true });
    } else {
      navigate({ to: '/login', replace: true });
    }
  }, [tenantSlug, publicTenant?.slug, logout, navigate]);

  const handleLogoutRef = useRef(handleLogout);
  handleLogoutRef.current = handleLogout;

  useEffect(() => {
    if (!isSessionExpiredModalOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(COUNTDOWN_SECONDS);
      setIsExtending(false);
      return;
    }

    setCountdown(COUNTDOWN_SECONDS);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleLogoutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionExpiredModalOpen]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const ok = await refreshSession();
      if (ok) {
        toast.success('¡Sesión extendida con éxito!');
      } else {
        toast.error('No se pudo renovar la sesión. Inicia sesión nuevamente.');
        handleLogout();
      }
    } catch {
      toast.error('Error al intentar extender la sesión.');
      handleLogout();
    } finally {
      setIsExtending(false);
    }
  };

  if (!isSessionExpiredModalOpen) {
    return null;
  }

  // Progress percentage (10s to 0s)
  const progressPercent = (countdown / COUNTDOWN_SECONDS) * 100;

  return (
    <Dialog open={isSessionExpiredModalOpen} disablePointerDismissal onOpenChange={() => {}}>
      <DialogContent 
        showCloseButton={false}
        className="sm:max-w-md bg-bg-card border border-border-card text-text-main p-6 sm:p-7 rounded-3xl shadow-2xl space-y-2"
      >
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-3 text-amber-600 shadow-xs">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <DialogTitle className="text-xl font-bold text-secondary tracking-tight">
            Tu sesión ha expirado
          </DialogTitle>

          <DialogDescription className="text-text-muted mt-1.5 text-sm leading-relaxed max-w-sm">
            Tu sesión de trabajo ha vencido por inactividad. ¿Deseas extenderla para continuar trabajando?
          </DialogDescription>
        </DialogHeader>

        {/* Countdown Badge & Progress Bar */}
        <div className="my-4 p-4 rounded-2xl bg-bg-dark border border-border-card flex flex-col items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Cierre automático en:</span>
            <span className="font-mono font-bold text-sm bg-amber-500/15 text-amber-700 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
              {countdown}s
            </span>
          </div>

          <div className="w-full bg-border-card h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-1/2 h-10 rounded-xl border-border-card bg-bg-card hover:bg-bg-dark text-secondary font-medium transition-colors"
            onClick={handleLogout}
            disabled={isExtending}
          >
            <LogOut className="w-4 h-4 mr-2 text-text-muted" />
            Cerrar sesión
          </Button>

          <Button
            type="button"
            className="w-full sm:w-1/2 h-10 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold shadow-md shadow-primary/10 transition-all"
            onClick={handleExtendSession}
            disabled={isExtending}
          >
            {isExtending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extendiendo...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Extender sesión
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
