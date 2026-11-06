import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '../services/purchases.service';
import type { CreateSupplierInput, UpdateSupplierInput, Supplier } from '../types/purchases.types';
import { toSupplierEntities } from '../mappers';
import type { SupplierEntity } from '../entities';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';

export const useSuppliers = (options?: { enabled?: boolean }): {
  suppliers: SupplierEntity[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();

  const suppliersQuery = useQuery<Supplier[], Error, SupplierEntity[]>({
    queryKey: ['suppliers', tenantId],
    queryFn: () => purchasesService.getSuppliers(),
    select: (data) => toSupplierEntities(data),
    enabled: (options?.enabled ?? true) && isAuthenticated && !!tenantId,
  });

  return {
    suppliers: suppliersQuery.data ?? [],
    isLoading: suppliersQuery.isLoading,
    isError: suppliersQuery.isError,
    refetch: suppliersQuery.refetch,
  };
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const createSupplierMutation = useMutation({
    mutationFn: (input: CreateSupplierInput) => purchasesService.createSupplier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
    },
  });

  return {
    createSupplier: createSupplierMutation.mutateAsync,
    isCreating: createSupplierMutation.isPending,
  };
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierInput }) =>
      purchasesService.updateSupplier(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
    },
  });

  return {
    updateSupplier: updateSupplierMutation.mutateAsync,
    isUpdating: updateSupplierMutation.isPending,
  };
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => purchasesService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
    },
  });

  return {
    deleteSupplier: deleteSupplierMutation.mutateAsync,
    isDeleting: deleteSupplierMutation.isPending,
  };
};
