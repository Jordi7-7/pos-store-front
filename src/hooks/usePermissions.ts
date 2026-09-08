import { useAuthStore } from '../modules/auth/hooks/useAuthStore';
import type { AppPermission } from '../constants/permissions';

export function usePermissions() {
  const { can, canAny, role, roleName, permissions, isAuthenticated } = useAuthStore();

  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN' || isOwner;

  return {
    can: (permission: AppPermission | string) => can(permission),
    canAny: (perms: (AppPermission | string)[]) => canAny(perms),
    isOwner,
    isAdmin,
    role,
    roleName,
    permissions,
    isAuthenticated,
  };
}
