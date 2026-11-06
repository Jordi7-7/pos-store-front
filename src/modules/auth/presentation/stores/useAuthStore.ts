import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authRepository, signIn } from '../../infrastructure/dependencies';
import { ProfileUnavailableError } from '../../application/use-cases/sign-in';
import type { SignInCredentials } from '../../application/ports/auth.repository';
import { queryClient } from '@/providers/QueryProvider';
import { CLIENT_ERROR_CODES, isApiError } from '@/shared/infrastructure/http/api-error';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
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
  // Estado transitorio (no se guarda). El token de acceso vive solo en memoria: el de renovación es una cookie HttpOnly.
  accessToken: string | null;
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
  /** Al arrancar: si hay un usuario guardado, recupera el token de acceso con la cookie de renovación. */
  restoreSession: () => Promise<void>;

  openSessionExpiredModal: () => void;
  closeSessionExpiredModal: () => void;
}

/** Autenticado = hay token, perfil y tienda. Se deriva; no se guarda. */
export const selectIsAuthenticated = (s: Pick<AuthState, 'accessToken' | 'user' | 'tenant'>): boolean =>
  Boolean(s.accessToken && s.user && s.tenant);

const FALLBACK_LOGIN_ERROR = 'No se pudo iniciar sesión. Inténtalo de nuevo.';

let inFlightProfilePromise: Promise<boolean> | null = null;

/**
 * La cookie de renovación rota en cada uso: dos pestañas renovando a la vez usarían la misma y el servidor lo tomaría
 * por un robo. El candado del navegador (Web Locks) las pone en fila; la segunda ya manda la cookie nueva.
 */
const withRefreshLock = <T>(task: () => Promise<T>): Promise<T> =>
  typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('pos-session-refresh', task) : task();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      /**
       * Guarda el usuario y la tienda del perfil, y mantiene coherente lo que depende de ellos:
       * la selección de sucursal/caja y la caché de datos si cambió moneda, país o zona horaria.
       */
      const applyProfile = (user: SessionUser, tenant: SessionTenant, extra: { accessToken?: string } = {}) => {
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
          applyProfile(session.user, session.tenant, { accessToken: session.tokens.accessToken });
          return { ok: true };
        } catch (error) {
          console.error('Error al iniciar sesión:', error);
          if (error instanceof ProfileUnavailableError) return { ok: false, code: PROFILE_UNAVAILABLE, message: error.message };
          const code = isApiError(error) ? error.code : CLIENT_ERROR_CODES.UNKNOWN_ERROR;
          return { ok: false, code, message: getErrorMessage(error, FALLBACK_LOGIN_ERROR) };
        }
      };

      /** Cierra la sesión en este navegador (la tienda se conserva: la pantalla de login la usa). */
      const clearLocalSession = () => {
        set({ accessToken: null, user: null, isSessionExpiredModalOpen: false });
        useWorkspaceStore.getState().reset();
        // Vaciar la caché de datos (dashboard, ventas, métricas…) del usuario anterior.
        try {
          queryClient.clear();
        } catch {
          // No-op si no está inicializado
        }
      };

      return {
      accessToken: null,
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
        // Avisar al backend: revoca la sesión en Redis y borra la cookie de renovación.
        authRepository.logout().catch(() => {});
        clearLocalSession();
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

      refreshSession: () =>
        withRefreshLock(async () => {
          try {
            const tokens = await authRepository.refresh();
            set({ accessToken: tokens.accessToken, isSessionExpiredModalOpen: false });
            // Mantener permisos y datos de la tienda sincronizados con el servidor.
            get().fetchProfile().catch(() => {});
            return true;
          } catch (err) {
            console.error('Error al renovar la sesión con la cookie:', err);
            return false;
          }
        }),

      restoreSession: async () => {
        if (!get().user || get().accessToken) return;
        try {
          const tokens = await withRefreshLock(() => authRepository.refresh());
          set({ accessToken: tokens.accessToken });
          void get().fetchProfile();
        } catch (error) {
          // Cookie vencida o revocada: no hay sesión que recuperar. Una caída de red NO borra nada: al volver la
          // conexión basta con iniciar sesión (el usuario guardado solo sirve para pintar la pantalla de login).
          if (isApiError(error) && error.status === 401) clearLocalSession();
          else console.error('No se pudo restaurar la sesión:', error);
        }
      },
      };
    },
    {
      name: 'aura-pos-auth',
      version: AUTH_STORAGE_VERSION,
      migrate: (persisted, version) => migratePersistedAuth(persisted, version) as unknown as AuthState,
      partialize: (state): PersistedAuth => ({
        user: state.user,
        tenant: state.tenant,
      }),
    },
  ),
);
