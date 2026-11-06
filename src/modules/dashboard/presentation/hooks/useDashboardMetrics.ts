import { useQuery } from '@tanstack/react-query';
import { dashboardRepository } from '../../infrastructure/dependencies';
import { useTenantId } from '@/modules/auth/presentation/hooks/useSession';

export const useDashboardMetrics = (branchId?: string | null) => {
  const tenantId = useTenantId();
  const effectiveBranchId = branchId || undefined;

  return useQuery({
    queryKey: ['dashboard-metrics', tenantId, effectiveBranchId || 'all'],
    queryFn: () => dashboardRepository.metrics(effectiveBranchId),
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 * 5, // auto refresh cada 5 minutos
  });
};
