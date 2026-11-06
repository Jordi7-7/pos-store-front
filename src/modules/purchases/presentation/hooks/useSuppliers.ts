import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersRepository } from '../../infrastructure/dependencies';
import type { CreateSupplierInput, UpdateSupplierInput } from '../../application/ports/suppliers.repository';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';

export const useSuppliers = (options?: { enabled?: boolean }): {
  suppliers: SupplierEntity[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();

  const suppliersQuery = useQuery<SupplierEntity[], Error>({
    queryKey: ['suppliers', tenantId],
    queryFn: () => suppliersRepository.list(),
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

  const mutation = useMutation({
    mutationFn: (input: CreateSupplierInput) => suppliersRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
    },
  });

  return { createSupplier: mutation.mutateAsync, isCreating: mutation.isPending };
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierInput }) => suppliersRepository.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
    },
  });

  return { updateSupplier: mutation.mutateAsync, isUpdating: mutation.isPending };
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const mutation = useMutation({
    mutationFn: (id: string) => suppliersRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
    },
  });

  return { deleteSupplier: mutation.mutateAsync, isDeleting: mutation.isPending };
};
