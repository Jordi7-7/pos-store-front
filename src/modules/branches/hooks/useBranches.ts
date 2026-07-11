import { useQuery } from '@tanstack/react-query';
import { branchesService } from '../services/branches.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useBranches = () => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const branchesQuery = useQuery({
    queryKey: ['branches', tenantId],
    queryFn: () => branchesService.getBranches(),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    branches: branchesQuery.data || [],
    isLoading: branchesQuery.isLoading,
    isError: branchesQuery.isError,
  };
};
export default useBranches;
