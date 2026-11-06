import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authRepository, signIn } from '../../infrastructure/dependencies';
import { ProfileUnavailableError } from '../../application/use-cases/sign-in';
import type { SignInCredentials } from '../../application/ports/auth.repository';
import { queryClient } from '@/providers/QueryProvider';
import { CLIENT_ERROR_CODES, isApiError } from '@/shared/infrastructure/http/api-error';
import { getErrorMessage } from '@/shared/presentation/error-messages';
import { useWorkspaceStore } from '@/shared/presentation/stores/workspace.store';
import {
  hasAnyPermission,
  hasPermission,
  tenantFormatKey,
  type SessionTenant,
  type SessionUser,
} from '../../domain/entities/session';
import type { LoginResult } from '../../domain/entities/login-result';
import { PROFILE_UNAVAILABLE } from '../../domain/entities/login-result';
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
      /**
       * Guarda el usuario y la tienda del perfil, y mantiene coherente lo que depende de ellos:
       * la selección de sucursal/caja y la caché de datos si cambió moneda, país o zona horaria.
       */
      const applyProfile = (user: SessionUser, tenant: SessionTenant, extra: Partial<PersistedAuth> = {}) => {
        const previousFormat = tenantFormatKey(get().tenant);
        set({ ...extra, user, tenant });
        useWorkspaceStore.getState().reconcile(user);
        // Los datos en caché ya vienen formateados con la configuración anterior: se descartan.
        if (previousFormat && previousFormat !== tenantFormatKey(tenant)) queryClient.clear();
      };

      /** Inicia sesión con el caso de uso y devuelve el motivo exacto si falla (por `code`, no por texto). */
      const startSession = async (credentials: SignInCredentials): Promise<LoginResult> => {
        try {
          const session = await signIn.execute(credentials);
          applyProfile(session.user, session.tenant, { accessToken: session.tokens.accessToken, refreshToken: session.tokens.refreshToken });
          return { ok: true };
        } catch (error) {
          console.error('Error al iniciar sesión:', error);
          if (error instanceof ProfileUnavailableError) return { ok: false, code: PROFILE_UNAVAILABLE, message: error.message };
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
          const tenant = await authRepository.getPublicTenant(cleanSlug);
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
        return startSession({ kind: 'password', identifier, password, tenantSlug });
      },

      // Login directo del cajero por PIN (solo necesita el identificador de la tienda).
      pinLogin: async (pin, slugOverride) => {
        const tenantSlug = slugOverride || get().tenant?.slug || '';
        return startSession({ kind: 'pin', pin, tenantSlug });
      },

      logout: () => {
        const { accessToken } = get();

        // Avisar al backend para que revoque la sesión en Redis.
        if (accessToken) {
          authRepository.logout(accessToken).catch(() => {});
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
            const { user, tenant } = await authRepository.getProfile();
            applyProfile(user, tenant);
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
          const tokens = await authRepository.refresh(refreshToken);
          set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isSessionExpiredModalOpen: false });
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
