import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesService } from '../services/branches.service';
import type { CreateBranchInput, UpdateBranchInput } from '../services/branches.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { toast } from 'sonner';

export const useBranches = () => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const branchesQuery = useQuery({
    queryKey: ['branches', tenantId],
    queryFn: () => branchesService.getBranches(),
    enabled: isAuthenticated && !!tenantId,
  });

  const createBranchMutation = useMutation({
    mutationFn: (data: CreateBranchInput) => branchesService.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
      toast.success('Sucursal creada exitosamente.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al crear la sucursal.');
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchInput }) =>
      branchesService.updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
      toast.success('Sucursal actualizada exitosamente.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al actualizar la sucursal.');
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
