import { apiClient } from '@/lib/apiClient';
import type { PermissionDefinition, PermissionModuleGroup } from '@/constants/permissions';

export interface RoleItem {
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

export interface PermissionsCatalogResponse {
  modules: PermissionModuleGroup[];
  permissions: PermissionDefinition[];
}

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

export const rolesService = {
  async getRoles(): Promise<RoleItem[]> {
    return apiClient.get<RoleItem[]>('/roles');
  },

  async getPermissionsCatalog(): Promise<PermissionsCatalogResponse> {
    return apiClient.get<PermissionsCatalogResponse>('/roles/permissions-catalog');
  },

  async createRole(data: CreateRoleInput): Promise<RoleItem> {
    return apiClient.post<RoleItem>('/roles', data);
  },

  async updateRole(id: string, data: UpdateRoleInput): Promise<RoleItem> {
    return apiClient.put<RoleItem>(`/roles/${id}`, data);
  },

  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/roles/${id}`);
  },
};
