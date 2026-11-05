import { selectIsAuthenticated, useAuthStore } from './useAuthStore';
import { branchIdsOf, roleLabel, type SessionTenant, type SessionUser } from '../domain/session';

/**
 * Lectura de la sesión mediante selectores: cada componente se suscribe solo al dato que usa
 * (antes, `const { tenantId } = useAuthStore()` re-renderizaba ante CUALQUIER cambio del store).
 */

/** Falta un dato de la tienda que se exige (no se inventan valores por defecto). */
export class MissingTenantDataError extends Error {
  constructor(field: string) {
    super(`No hay ${field} de la tienda en la sesión.`);
    this.name = 'MissingTenantDataError';
  }
}

export const useIsAuthenticated = (): boolean => useAuthStore(selectIsAuthenticated);
export const useUser = (): SessionUser | null => useAuthStore((s) => s.user);
export const useTenant = (): SessionTenant | null => useAuthStore((s) => s.tenant);
export const useTenantId = (): string | null => useAuthStore((s) => s.tenant?.id ?? null);
export const useIsOwner = (): boolean => useAuthStore((s) => Boolean(s.user?.isOwner));
export const useRoleName = (): string => useAuthStore((s) => roleLabel(s.user));

/** Zona horaria de la tienda. Falla si no hay: debe usarse solo con sesión abierta. */
export const useTimezone = (): string => {
  const timezone = useAuthStore((s) => s.tenant?.timezone);
  if (!timezone) throw new MissingTenantDataError('zona horaria');
  return timezone;
};

/** Código de moneda de la tienda (p. ej. `MXN`). Falla si no hay. */
export const useCurrencyCode = (): string => {
  const code = useAuthStore((s) => s.tenant?.currencyCode);
  if (!code) throw new MissingTenantDataError('moneda');
  return code;
};

// ── Lectura fuera de React (mappers, guardas de ruta) ───────────────────────────────────────────

export const getSession = () => useAuthStore.getState();

export function getTenantTimezone(): string {
  const timezone = useAuthStore.getState().tenant?.timezone;
  if (!timezone) throw new MissingTenantDataError('zona horaria');
  return timezone;
}

export const getUserBranchIds = (): string[] => branchIdsOf(useAuthStore.getState().user);
