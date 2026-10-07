import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesService } from '../services/roles.service';
import type { RoleItem, CreateRoleInput, UpdateRoleInput } from '../services/roles.service';
import type { PermissionDefinition, PermissionModuleGroup } from '@/constants/permissions';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { toast } from 'sonner';

export const PERMISSIONS_CATALOG_KEY = ['permissions-catalog'];

export function useRoles() {
  const { tenantId, isAuthenticated } = useAuthStore();

  const { data: roles = [], isLoading, refetch } = useQuery<RoleItem[]>({
    queryKey: ['roles', tenantId],
    queryFn: () => rolesService.getRoles(),
    enabled: isAuthenticated && Boolean(tenantId),
  });

  return { roles, isLoading, refetch };
}

export function usePermissionsCatalog(): {
  modules: PermissionModuleGroup[];
  permissions: PermissionDefinition[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: PERMISSIONS_CATALOG_KEY,
    queryFn: () => rolesService.getPermissionsCatalog(),
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });

  return {
    modules: data?.modules ?? [],
    permissions: data?.permissions ?? [],
    isLoading,
  };
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const mutation = useMutation({
    mutationFn: (data: CreateRoleInput) => rolesService.createRole(data),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles', tenantId] });
      toast.success(`Rol "${newRole.name}" creado con éxito.`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al crear el rol.');
    },
  });

  return {
    createRole: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) =>
      rolesService.updateRole(id, data),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles', tenantId] });
      toast.success(`Rol "${updatedRole.name}" actualizado.`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al actualizar el rol.');
    },
  });

  return {
    updateRole: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const mutation = useMutation({
    mutationFn: (id: string) => rolesService.deleteRole(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles', tenantId] });
      toast.success(res.message || 'Rol eliminado.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar el rol.');
    },
  });

  return {
    deleteRole: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
