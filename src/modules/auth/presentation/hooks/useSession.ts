import { selectIsAuthenticated, useAuthStore } from '../stores/useAuthStore';
import { branchIdsOf, roleLabel, tenantFormatKey, type SessionTenant, type SessionUser } from '../../domain/entities/session';
import { formatMoneyAmount, localeForCountry } from '@/shared/domain/rules/format-money';

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
/** Cambia cuando cambia la moneda, el país o la zona horaria de la tienda: úsala como `key` para repintar. */
export const useTenantFormatKey = (): string => useAuthStore((s) => tenantFormatKey(s.tenant));
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

function requireTenant(): SessionTenant {
  const tenant = useAuthStore.getState().tenant;
  if (!tenant) throw new MissingTenantDataError('datos');
  return tenant;
}

/** Idioma de formato (fechas, números) según el país de la tienda: `MX` → `es-MX`. */
export const getTenantLocale = (): string => localeForCountry(requireTenant().country);

/**
 * Importe con la moneda y el idioma de la tienda (`$1,234.50` en MXN). Se lee de la sesión al
 * llamarse, así que sirve en mappers y componentes; debe usarse solo con sesión abierta.
 */
export function formatMoney(value: number | null | undefined): string {
  const tenant = requireTenant();
  return formatMoneyAmount(value, tenant.currencyCode, localeForCountry(tenant.country));
}
