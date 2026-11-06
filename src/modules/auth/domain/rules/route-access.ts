import { APP_PERMISSIONS } from '@/constants/permissions';
import { hasPermission, type SessionUser } from '../entities/session';

/**
 * Permiso que exige cada pantalla. Es la ÚNICA tabla: el menú, las guardas de ruta y los tests
 * la leen de aquí. El orden importa: es el orden en que se busca una pantalla de inicio permitida.
 * El backend sigue siendo quien decide (403); esto evita pintar pantallas que no se pueden usar.
 */
export const ROUTE_PERMISSIONS = {
  '/dashboard': APP_PERMISSIONS.VIEW_DASHBOARD,
  '/pos': APP_PERMISSIONS.VIEW_POS,
  '/ventas': APP_PERMISSIONS.VIEW_SALES,
  '/inventario/productos': APP_PERMISSIONS.VIEW_PRODUCTS,
  '/inventario/lotes': APP_PERMISSIONS.VIEW_PRODUCTS,
  '/inventario/crear': APP_PERMISSIONS.PRODUCTS_CREATE,
  '/inventario/crear-compuesto': APP_PERMISSIONS.PRODUCTS_CREATE,
  '/compras/registrar': APP_PERMISSIONS.PURCHASES_CREATE,
  '/compras/historial': APP_PERMISSIONS.VIEW_PURCHASES,
  '/compras/proveedores': APP_PERMISSIONS.VIEW_SUPPLIERS,
  '/clientes': APP_PERMISSIONS.VIEW_CUSTOMERS,
  '/cajas/registradoras': APP_PERMISSIONS.VIEW_CASH_REGISTERS,
  '/cajas/historial': APP_PERMISSIONS.VIEW_CASH_SESSIONS,
  '/reportes/costo-ventas': APP_PERMISSIONS.VIEW_REPORTS,
  '/reportes/ventas-productos': APP_PERMISSIONS.VIEW_REPORTS,
  '/reportes/existencias-valuadas': APP_PERMISSIONS.VIEW_REPORTS,
  '/usuarios': APP_PERMISSIONS.VIEW_USERS,
  '/multimedia': APP_PERMISSIONS.VIEW_MEDIA,
  '/configuracion': APP_PERMISSIONS.VIEW_SETTINGS,
} as const;

export type GuardedPath = keyof typeof ROUTE_PERMISSIONS;

export const canAccessRoute = (user: SessionUser | null, path: GuardedPath): boolean =>
  hasPermission(user, ROUTE_PERMISSIONS[path]);

/**
 * Pantalla de inicio: el propietario al panel; el resto, a la primera pantalla que sí puede usar
 * (normalmente el POS). Si no puede usar ninguna devuelve `/pos`, y la guarda lo deja pasar para
 * no entrar en un bucle de redirecciones.
 */
export function homeRouteFor(user: SessionUser | null): GuardedPath {
  if (user?.isOwner) return '/dashboard';
  const first = (Object.keys(ROUTE_PERMISSIONS) as GuardedPath[]).find((path) => canAccessRoute(user, path));
  return first ?? '/pos';
}

export type RouteDecision = { allowed: true } | { allowed: false; redirectTo: GuardedPath };

/** Decide si el usuario puede abrir la pantalla y, si no, a cuál se le manda. */
export function decideRouteAccess(user: SessionUser | null, path: GuardedPath): RouteDecision {
  if (canAccessRoute(user, path)) return { allowed: true };
  const redirectTo = homeRouteFor(user);
  // Sin ninguna pantalla permitida no hay a dónde mandarlo: se evita el bucle.
  return redirectTo === path ? { allowed: true } : { allowed: false, redirectTo };
}
