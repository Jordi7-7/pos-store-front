import type { SessionTenant, SessionUser } from '../../domain/session';

/** Versión del formato guardado en `localStorage` (`aura-pos-auth`). Súbela con cada cambio de forma. */
export const AUTH_STORAGE_VERSION = 1;

/** Lo único que se guarda de la sesión: tokens, usuario y tienda (la selección de sucursal/caja es otro store). */
export interface PersistedAuth {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  tenant: SessionTenant | null;
}

const EMPTY: PersistedAuth = {
  accessToken: null,
  refreshToken: null,
  user: null,
  tenant: null,
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

/**
 * Convierte lo guardado por la versión anterior (plana, con campos duplicados) al formato actual,
 * para que nadie pierda la sesión al desplegar. Si falta algo imprescindible (usuario, tienda o
 * tokens) se descarta la sesión y se vuelve al login: mejor eso que una sesión a medias.
 */
export function migratePersistedAuth(persisted: unknown, version: number): PersistedAuth {
  if (version >= AUTH_STORAGE_VERSION) return isRecord(persisted) ? { ...EMPTY, ...(persisted as Partial<PersistedAuth>) } : EMPTY;
  if (!isRecord(persisted)) return EMPTY;

  const legacyTenant = isRecord(persisted.publicTenant) ? persisted.publicTenant : null;
  const tenant = legacyTenant ? toTenant(legacyTenant) : null;
  const legacyUser = isRecord(persisted.user) ? persisted.user : null;
  const accessToken = str(persisted.accessToken);
  const refreshToken = str(persisted.refreshToken);

  const base: PersistedAuth = {
    ...EMPTY,
    tenant,
  };

  const userId = legacyUser ? str(legacyUser.id) : null;
  if (!legacyUser || !userId || !tenant || !accessToken || !refreshToken) return base;

  const isOwner = persisted.role === 'OWNER';
  const roleId = str(persisted.roleId);
  const roleName = str(persisted.roleName);
  const branchIds = stringArray(persisted.branchIds ?? legacyUser.branchIds);

  return {
    ...base,
    accessToken,
    refreshToken,
    user: {
      id: userId,
      name: str(legacyUser.name) ?? '',
      username: str(legacyUser.username) ?? '',
      email: str(legacyUser.email),
      isOwner,
      role: !isOwner && roleId && roleName ? { id: roleId, name: roleName } : null,
      permissions: stringArray(persisted.permissions),
      // El perfil antiguo solo guardaba los ids; los nombres se completan al revalidar el perfil.
      branches: branchIds.map((id) => ({ id, name: '' })),
      cashRegisters: Array.isArray(persisted.cashRegisters) ? (persisted.cashRegisters as SessionUser['cashRegisters']) : [],
    },
  };
}

function toTenant(raw: Record<string, unknown>): SessionTenant | null {
  const id = str(raw.id);
  const name = str(raw.name);
  const slug = str(raw.slug);
  const country = str(raw.country);
  const currencyCode = str(raw.currencyCode);
  const currencySymbol = str(raw.currencySymbol);
  const timezone = str(raw.timezone);
  if (!id || !name || !slug || !country || !currencyCode || !currencySymbol || !timezone) return null;
  const ruc = str(raw.ruc);
  return { id, name, slug, ...(ruc ? { ruc } : {}), logoUrl: str(raw.logoUrl), country, currencyCode, currencySymbol, timezone };
}

function stringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
