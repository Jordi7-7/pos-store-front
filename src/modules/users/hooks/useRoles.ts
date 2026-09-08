import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesService } from '../services/roles.service';
import type { CreateRoleInput, UpdateRoleInput } from '../services/roles.service';
import { toast } from 'sonner';

export const ROLES_QUERY_KEY = ['roles'];
export const PERMISSIONS_CATALOG_KEY = ['permissions-catalog'];

export function useRoles() {
  const { data: roles = [], isLoading, refetch } = useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: () => rolesService.getRoles(),
  });

  return { roles, isLoading, refetch };
}

export function usePermissionsCatalog() {
  const { data, isLoading } = useQuery({
    queryKey: PERMISSIONS_CATALOG_KEY,
    queryFn: () => rolesService.getPermissionsCatalog(),
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });

  return {
    modules: data?.modules || [],
    permissions: data?.permissions || [],
    isLoading,
  };
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateRoleInput) => rolesService.createRole(data),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
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

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) =>
      rolesService.updateRole(id, data),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
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

  const mutation = useMutation({
    mutationFn: (id: string) => rolesService.deleteRole(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
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
