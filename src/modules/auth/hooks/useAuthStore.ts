import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';
import { queryClient } from '@/providers/QueryProvider';
import { isApiError } from '@/shared/infrastructure/http/api-error';
import { getErrorMessage } from '@/shared/presentation/error-messages';
import { useWorkspaceStore } from '@/shared/presentation/stores/workspace.store';
import {
  hasAnyPermission,
  hasPermission,
  tenantFormatKey,
  type SessionTenant,
} from '../domain/session';
import { toSessionTenant, toSessionUser } from '../mappers/session.mapper';
import { AUTH_STORAGE_VERSION, migratePersistedAuth, type PersistedAuth } from './auth-persistence';

export type PublicTenant = SessionTenant;

interface AuthState extends PersistedAuth {
  // Estado transitorio (no se guarda)
  isLoadingTenant: boolean;
  tenantError: string | null;
  isSessionExpiredModalOpen: boolean;

  // Permisos
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;

  // Tienda
  fetchPublicTenant: (slug: string) => Promise<boolean>;
  clearTenant: () => void;

  // Sesión
  login: (identifier: string, password: string, _targetWorkflow?: 'admin' | 'store', slugOverride?: string) => Promise<boolean>;
  pinLogin: (pin: string, slugOverride?: string) => Promise<'SUCCESS' | 'INVALID' | 'EXPIRED' | 'NOT_FOUND'>;
  logout: () => void;
  fetchProfile: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;

  openSessionExpiredModal: () => void;
  closeSessionExpiredModal: () => void;
}

/** Autenticado = hay token, perfil y tienda. Se deriva; no se guarda. */
export const selectIsAuthenticated = (s: Pick<PersistedAuth, 'accessToken' | 'user' | 'tenant'>): boolean =>
  Boolean(s.accessToken && s.user && s.tenant);

let inFlightProfilePromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      tenant: null,
      isLoadingTenant: false,
      tenantError: null,
      isSessionExpiredModalOpen: false,

      openSessionExpiredModal: () => {
        if (selectIsAuthenticated(get())) set({ isSessionExpiredModalOpen: true });
      },
      closeSessionExpiredModal: () => set({ isSessionExpiredModalOpen: false }),

      can: (permission) => {
        const { accessToken, user } = get();
        return Boolean(accessToken) && hasPermission(user, permission);
      },
      canAny: (permissions) => {
        const { accessToken, user } = get();
        return Boolean(accessToken) && hasAnyPermission(user, permissions);
      },

      clearTenant: () => set({ tenant: null, tenantError: null }),

      fetchPublicTenant: async (slug) => {
        const cleanSlug = slug.toLowerCase().trim();
        if (!cleanSlug) return false;

        // Si ya tenemos exactamente esta tienda, no volvemos a consultar.
        if (get().tenant?.slug.toLowerCase() === cleanSlug) return true;

        set({ isLoadingTenant: true, tenantError: null });
        try {
          const tenant = toSessionTenant(await authService.getPublicTenantBySlug(cleanSlug));
          set({ tenant, isLoadingTenant: false, tenantError: null });
          return true;
        } catch (err) {
          console.error('Error al consultar la tienda:', err);
          set((state) => ({
            // Con sesión abierta no se borra la tienda: la interfaz la necesita.
            tenant: selectIsAuthenticated(state) ? state.tenant : null,
            isLoadingTenant: false,
            tenantError: getErrorMessage(err, 'Error al conectar con la tienda'),
          }));
          return false;
        }
      },

      login: async (identifier, password, _targetWorkflow = 'store', slugOverride) => {
        const effectiveSlug = slugOverride || get().tenant?.slug || undefined;
        try {
          const response = await authService.login({ email: identifier, password, tenantSlug: effectiveSlug });
          if (!response?.accessToken) return false;

          set({ accessToken: response.accessToken, refreshToken: response.refreshToken });

          if (!(await get().fetchProfile())) {
            get().logout();
            return false;
          }
          return true;
        } catch (error) {
          console.error('Error de login en backend:', error);
          return false;
        }
      },

      // Login directo del cajero por PIN (solo necesita el identificador de la tienda).
      pinLogin: async (pin, slugOverride) => {
        const effectiveSlug = slugOverride || get().tenant?.slug || '';
        try {
          const response = await authService.pinLogin({ pin, tenantSlug: effectiveSlug });
          if (!response?.accessToken) return 'INVALID';

          set({ accessToken: response.accessToken, refreshToken: response.refreshToken });

          if (!(await get().fetchProfile())) {
            get().logout();
            return 'INVALID';
          }
          return 'SUCCESS';
        } catch (error) {
          console.error('Error de PIN login:', error);
          return isApiError(error) && error.code === 'TENANT_NOT_FOUND' ? 'NOT_FOUND' : 'INVALID';
        }
      },

      logout: () => {
        const { accessToken } = get();

        // Avisar al backend para que revoque la sesión en Redis.
        if (accessToken) {
          authService.logout(accessToken).catch(() => {});
        }

        // La tienda se conserva a propósito: la pantalla de login la usa.
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isSessionExpiredModalOpen: false,
        });
        useWorkspaceStore.getState().reset();

        // Vaciar la caché de datos (dashboard, ventas, métricas…) del usuario anterior.
        try {
          queryClient.clear();
        } catch {
          // No-op si no está inicializado
        }
      },

      fetchProfile: async () => {
        if (inFlightProfilePromise) return inFlightProfilePromise;

        inFlightProfilePromise = (async () => {
          if (!get().accessToken) return false;
          try {
            const profile = await authService.getProfile();
            const user = toSessionUser(profile);
            const tenant = toSessionTenant(profile.tenant);
            const previousFormat = tenantFormatKey(get().tenant);
            set({ user, tenant });
            useWorkspaceStore.getState().reconcile(user);
            // Cambió la moneda, el país o la zona horaria: los datos guardados en caché ya vienen
            // formateados con la configuración anterior; se descartan para volver a pedirlos.
            if (previousFormat && previousFormat !== tenantFormatKey(tenant)) {
              queryClient.clear();
            }
            return true;
          } catch (error) {
            console.error('Error al obtener el perfil:', error);
            // Solo un 401 (sesión inválida incluso tras intentar renovarla) cierra la sesión.
            // Una caída de red o un 500 no debe sacar al cajero en pleno turno.
            if (isApiError(error) && error.status === 401) {
              get().logout();
            }
            return false;
          } finally {
            inFlightProfilePromise = null;
          }
        })();

        return inFlightProfilePromise;
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const response = await authService.refresh(refreshToken);
          if (!response?.accessToken) return false;
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken || refreshToken,
            isSessionExpiredModalOpen: false,
          });
          // Mantener permisos y datos de la tienda sincronizados con el servidor.
          get().fetchProfile().catch(() => {});
          return true;
        } catch (err) {
          console.error('Error al renovar sesión con refresh token:', err);
          return false;
        }
      },
    }),
    {
      name: 'aura-pos-auth',
      version: AUTH_STORAGE_VERSION,
      migrate: (persisted, version) => migratePersistedAuth(persisted, version) as unknown as AuthState,
      partialize: (state): PersistedAuth => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        tenant: state.tenant,
      }),
    },
  ),
);
