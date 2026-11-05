import { toast } from 'sonner';
import { configureApiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

/** Raíz de composición: único sitio que une el cliente HTTP con el store de sesión y los avisos. */
export function setupApiClient(): void {
  configureApiClient({
    getAccessToken: () => useAuthStore.getState().accessToken,
    refreshSession: () => useAuthStore.getState().refreshSession(),
    onSessionExpired: () => {
      useAuthStore.getState().logout();
      toast.error('Tu sesión ha expirado por completo. Por favor inicia sesión nuevamente.');
    },
  });
}
