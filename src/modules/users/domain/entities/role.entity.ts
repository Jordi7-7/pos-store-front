import type { PermissionDefinition, PermissionModuleGroup } from '@/constants/permissions';

/** Rol con los permisos que concede. */
export interface RoleEntity {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

/** Permisos que existen en el sistema, agrupados por módulo (lo publica el backend). */
export interface PermissionsCatalog {
  modules: PermissionModuleGroup[];
  permissions: PermissionDefinition[];
}
