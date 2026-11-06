import { toast } from 'sonner';
import { configureApiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/modules/auth/presentation/stores/useAuthStore';

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
 * Al arrancar: si hay un usuario guardado, recupera el token de acceso con la cookie de renovación (la pantalla
 * espera este resultado) y el perfil se vuelve a pedir en segundo plano, para que permisos y datos de la tienda
 * no queden viejos entre recargas.
 */
export async function restoreSessionOnStart(): Promise<void> {
  await useAuthStore.getState().restoreSession();
}
