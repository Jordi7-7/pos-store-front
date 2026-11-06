import type { SessionTenant, SessionUser } from '../../domain/entities/session';

/** Versión del formato guardado en `localStorage` (`aura-pos-auth`). Súbela con cada cambio de forma. */
export const AUTH_STORAGE_VERSION = 2;

/**
 * Lo único que se guarda de la sesión: usuario y tienda (datos que se muestran, no secretos). Los tokens NO se
 * guardan: el de acceso vive en memoria y el de renovación en una cookie `HttpOnly` que gestiona el navegador.
 * La selección de sucursal/caja es otro store.
 */
export interface PersistedAuth {
  user: SessionUser | null;
  tenant: SessionTenant | null;
}

const EMPTY: PersistedAuth = {
  user: null,
  tenant: null,
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

/**
 * Lo guardado por versiones anteriores (que incluían los tokens en `localStorage`) se descarta salvo la tienda,
 * que la pantalla de login necesita: quien tenía sesión abierta vuelve a iniciar sesión una vez, y los tokens
 * viejos desaparecen del navegador en cuanto se reescribe el almacenamiento.
 */
export function migratePersistedAuth(persisted: unknown, version: number): PersistedAuth {
  if (!isRecord(persisted)) return EMPTY;
  if (version >= AUTH_STORAGE_VERSION) return { ...EMPTY, user: (persisted.user as SessionUser | null) ?? null, tenant: (persisted.tenant as SessionTenant | null) ?? null };

  // Versión 1: `tenant` ya tiene la forma actual. Versión 0 (plana): la tienda estaba en `publicTenant`.
  const legacyTenant = isRecord(persisted.tenant) ? persisted.tenant : isRecord(persisted.publicTenant) ? persisted.publicTenant : null;
  return { user: null, tenant: legacyTenant ? toTenant(legacyTenant) : null };
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

