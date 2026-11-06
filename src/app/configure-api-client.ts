import { toast } from 'sonner';
import { configureApiClient } from '@/lib/apiClient';
import { selectIsAuthenticated, useAuthStore } from '@/modules/auth/presentation/stores/useAuthStore';

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

/**
 * Al arrancar, el perfil guardado en el navegador se vuelve a pedir al servidor: así los permisos
 * y los datos de la tienda no quedan viejos entre recargas. Sin esperar: la pantalla pinta con lo guardado.
 */
export function revalidateSession(): void {
  if (selectIsAuthenticated(useAuthStore.getState())) {
    void useAuthStore.getState().fetchProfile();
  }
}
