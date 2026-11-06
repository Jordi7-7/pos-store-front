import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesRepository } from '../../infrastructure/dependencies';
import type { CreateRoleInput, UpdateRoleInput } from '../../application/ports/roles.repository';
import type { RoleEntity } from '../../domain/entities/role.entity';
import type { PermissionDefinition, PermissionModuleGroup } from '@/constants/permissions';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';

export const PERMISSIONS_CATALOG_KEY = ['permissions-catalog'];

export function useRoles() {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();

  const { data: roles = [], isLoading, refetch } = useQuery<RoleEntity[]>({
    queryKey: ['roles', tenantId],
    queryFn: () => rolesRepository.list(),
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
    queryFn: () => rolesRepository.permissionsCatalog(),
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
  const tenantId = useTenantId();

  const mutation = useMutation({
    mutationFn: (data: CreateRoleInput) => rolesRepository.create(data),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles', tenantId] });
      toast.success(`Rol "${newRole.name}" creado con éxito.`);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Error al crear el rol.'));
    },
  });

  return {
    createRole: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) =>
      rolesRepository.update(id, data),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles', tenantId] });
      toast.success(`Rol "${updatedRole.name}" actualizado.`);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Error al actualizar el rol.'));
    },
  });

  return {
    updateRole: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const mutation = useMutation({
    mutationFn: (id: string) => rolesRepository.remove(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles', tenantId] });
      toast.success(res.message || 'Rol eliminado.');
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Error al eliminar el rol.'));
    },
  });

  return {
    deleteRole: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
