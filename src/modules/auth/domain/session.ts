/**
 * Modelo de sesión común a web y móvil (ver docs/auth-session-contract.md).
 *
 * Una sesión son TRES cosas y nada más: tokens, usuario (perfil) y tienda. Todo lo demás
 * (¿está autenticado?, zona horaria, moneda, id de tienda, rol, sucursales…) se DERIVA de estas
 * tres, nunca se guarda duplicado. La selección de sucursal/caja es estado de trabajo, aparte.
 */

export interface SessionRole {
  id: string;
  name: string;
}

export interface SessionBranch {
  id: string;
  name: string;
  address?: string | null;
}

export interface SessionCashRegister {
  id: string;
  name: string;
  code: number;
  branchId: string;
}

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  email: string | null;
  isOwner: boolean;
  role: SessionRole | null;
  permissions: string[];
  branches: SessionBranch[];
  cashRegisters: SessionCashRegister[];
}

/** Datos de la tienda. Todos obligatorios: no se inventan valores por defecto. */
export interface SessionTenant {
  id: string;
  name: string;
  slug: string;
  ruc?: string;
  logoUrl: string | null;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
}

export const OWNER_LABEL = 'Propietario';
const DEFAULT_ROLE_LABEL = 'Usuario';

export function hasPermission(user: SessionUser | null, permission: string): boolean {
  if (!user) return false;
  return user.isOwner || user.permissions.includes('*') || user.permissions.includes(permission);
}

export function hasAnyPermission(user: SessionUser | null, permissions: readonly string[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function roleLabel(user: SessionUser | null): string {
  if (!user) return DEFAULT_ROLE_LABEL;
  return user.isOwner ? OWNER_LABEL : (user.role?.name ?? DEFAULT_ROLE_LABEL);
}

export const branchIdsOf = (user: SessionUser | null): string[] => (user ? user.branches.map((b) => b.id) : []);

/** Pantalla de inicio según el perfil: el propietario al panel, el resto al POS. */
export function homeRouteFor(user: SessionUser | null): '/dashboard' | '/pos' {
  return user?.isOwner ? '/dashboard' : '/pos';
}
