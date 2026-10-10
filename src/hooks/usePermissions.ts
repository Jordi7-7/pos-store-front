import { useAuthStore, SystemRole } from '../modules/auth';
import type { AppPermission } from '../constants/permissions';

export function usePermissions() {
  const { can, canAny, role, roleName, permissions, isAuthenticated } = useAuthStore();

  const isOwner = role === SystemRole.OWNER;

  return {
    can: (permission: AppPermission | string) => can(permission),
    canAny: (perms: (AppPermission | string)[]) => canAny(perms),
    isOwner,
    role,
    roleName,
    permissions,
    isAuthenticated,
  };
}
