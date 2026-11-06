import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesRepository } from '../../infrastructure/dependencies';
import type { CreateBranchInput, UpdateBranchInput } from '../../application/ports/branches.repository';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';

export const useBranches = () => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const queryClient = useQueryClient();

  const branchesQuery = useQuery({
    queryKey: ['branches', tenantId],
    queryFn: () => branchesRepository.list(),
    enabled: isAuthenticated && !!tenantId,
    staleTime: 1000 * 60 * 10, // 10 minutos de caché
  });

  const createBranchMutation = useMutation({
    mutationFn: (data: CreateBranchInput) => branchesRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
      toast.success('Sucursal creada exitosamente.');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, 'Error al crear la sucursal.'));
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchInput }) =>
      branchesRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
      toast.success('Sucursal actualizada exitosamente.');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, 'Error al actualizar la sucursal.'));
    },
  });

  return {
    branches: branchesQuery.data || [],
    isLoading: branchesQuery.isLoading,
    isError: branchesQuery.isError,
    refetch: branchesQuery.refetch,
    createBranch: createBranchMutation.mutateAsync,
    isCreating: createBranchMutation.isPending,
    updateBranch: updateBranchMutation.mutateAsync,
    isUpdating: updateBranchMutation.isPending,
  };
};
export default useBranches;
