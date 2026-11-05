import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { useTenantId } from '@/modules/auth/hooks/useSession';

export const useDashboardMetrics = (branchId?: string | null) => {
  const tenantId = useTenantId();
  const effectiveBranchId = branchId || undefined;

  return useQuery({
    queryKey: ['dashboard-metrics', tenantId, effectiveBranchId || 'all'],
    queryFn: () => dashboardService.getMetrics(effectiveBranchId),
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 * 5, // auto refresh cada 5 minutos
  });
};
