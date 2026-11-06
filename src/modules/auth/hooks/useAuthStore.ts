import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';
import { queryClient } from '@/providers/QueryProvider';
import { CLIENT_ERROR_CODES, isApiError } from '@/shared/infrastructure/http/api-error';
import { getErrorMessage } from '@/shared/presentation/error-messages';
import { useWorkspaceStore } from '@/shared/presentation/stores/workspace.store';
import {
  hasAnyPermission,
  hasPermission,
  tenantFormatKey,
  type SessionTenant,
} from '../domain/session';
import { toSessionTenant, toSessionUser } from '../mappers/session.mapper';
import type { LoginResult } from '../domain/login-result';
import { PROFILE_UNAVAILABLE } from '../domain/login-result';
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
  login: (identifier: string, password: string, slugOverride?: string) => Promise<LoginResult>;
  pinLogin: (pin: string, slugOverride?: string) => Promise<LoginResult>;
  logout: () => void;
  fetchProfile: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;

  openSessionExpiredModal: () => void;
  closeSessionExpiredModal: () => void;
}

/** Autenticado = hay token, perfil y tienda. Se deriva; no se guarda. */
export const selectIsAuthenticated = (s: Pick<PersistedAuth, 'accessToken' | 'user' | 'tenant'>): boolean =>
  Boolean(s.accessToken && s.user && s.tenant);

const FALLBACK_LOGIN_ERROR = 'No se pudo iniciar sesión. Inténtalo de nuevo.';

let inFlightProfilePromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      /** Pide los tokens, carga el perfil y devuelve el motivo exacto si algo falla. */
      const startSession = async (request: () => Promise<{ accessToken?: string; refreshToken?: string }>): Promise<LoginResult> => {
        try {
          const response = await request();
          if (!response?.accessToken) {
            return { ok: false, code: PROFILE_UNAVAILABLE, message: getErrorMessage(null, FALLBACK_LOGIN_ERROR) };
          }
          set({ accessToken: response.accessToken, refreshToken: response.refreshToken ?? null });
          if (!(await get().fetchProfile())) {
            get().logout();
            return { ok: false, code: PROFILE_UNAVAILABLE, message: 'No se pudo cargar tu perfil. Inténtalo de nuevo.' };
          }
          return { ok: true };
        } catch (error) {
          console.error('Error al iniciar sesión:', error);
          const code = isApiError(error) ? error.code : CLIENT_ERROR_CODES.UNKNOWN_ERROR;
          return { ok: false, code, message: getErrorMessage(error, FALLBACK_LOGIN_ERROR) };
        }
      };

      return {
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

      login: async (identifier, password, slugOverride) => {
        const tenantSlug = slugOverride || get().tenant?.slug || undefined;
        return startSession(() => authService.login({ email: identifier, password, tenantSlug }));
      },

      // Login directo del cajero por PIN (solo necesita el identificador de la tienda).
      pinLogin: async (pin, slugOverride) => {
        const tenantSlug = slugOverride || get().tenant?.slug || '';
        return startSession(() => authService.pinLogin({ pin, tenantSlug }));
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
      };
    },
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
