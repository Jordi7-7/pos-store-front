import { hasAnyPermission, hasPermission, useIsAuthenticated, useIsOwner, useRoleName, useUser } from '../modules/auth';
import type { AppPermission } from '../constants/permissions';

export function usePermissions() {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isOwner = useIsOwner();
  const roleName = useRoleName();

  return {
    can: (permission: AppPermission | string) => isAuthenticated && hasPermission(user, permission),
    canAny: (perms: (AppPermission | string)[]) => isAuthenticated && hasAnyPermission(user, perms),
    isOwner,
    roleName,
    permissions: user?.permissions ?? [],
    isAuthenticated,
  };
}
