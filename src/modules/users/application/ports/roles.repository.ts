import type { PermissionsCatalog, RoleEntity } from '../../domain/entities/role.entity';

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

/** Puerto de salida: roles y catálogo de permisos en el servidor. */
export interface RolesRepository {
  list(): Promise<RoleEntity[]>;
  permissionsCatalog(): Promise<PermissionsCatalog>;
  create(input: CreateRoleInput): Promise<RoleEntity>;
  update(id: string, input: UpdateRoleInput): Promise<RoleEntity>;
  remove(id: string): Promise<{ success: boolean; message: string }>;
}
