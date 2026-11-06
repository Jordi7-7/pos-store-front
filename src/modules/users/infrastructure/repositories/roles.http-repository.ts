import { apiClient } from '@/lib/apiClient';
import type { CreateRoleInput, RolesRepository, UpdateRoleInput } from '../../application/ports/roles.repository';
import type { PermissionsCatalog, RoleEntity } from '../../domain/entities/role.entity';

/** Roles y catálogo de permisos por HTTP. */
export class RolesHttpRepository implements RolesRepository {
  list(): Promise<RoleEntity[]> {
    return apiClient.get<RoleEntity[]>('/roles');
  }

  permissionsCatalog(): Promise<PermissionsCatalog> {
    return apiClient.get<PermissionsCatalog>('/roles/permissions-catalog');
  }

  create(input: CreateRoleInput): Promise<RoleEntity> {
    return apiClient.post<RoleEntity>('/roles', input);
  }

  update(id: string, input: UpdateRoleInput): Promise<RoleEntity> {
    return apiClient.put<RoleEntity>(`/roles/${id}`, input);
  }

  remove(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/roles/${id}`);
  }
}
