import { redirect } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/useAuthStore';
import { decideRouteAccess, type GuardedPath } from '../../domain/rules/route-access';

/**
 * `beforeLoad` de una pantalla protegida: si el usuario no tiene el permiso que la tabla
 * `ROUTE_PERMISSIONS` exige, avisa y lo manda a su pantalla de inicio.
 */
export function guardRoute(path: GuardedPath): void {
  const decision = decideRouteAccess(useAuthStore.getState().user, path);
  if (decision.allowed) return;
  toast.error('No tienes permiso para abrir esa pantalla');
  throw redirect({ to: decision.redirectTo });
}
