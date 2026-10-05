import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useDashboardMetrics = (branchId?: string | null) => {
  const tenantId = useAuthStore((state) => state.tenantId);

  return useQuery({
    queryKey: ['dashboard-metrics', tenantId, branchId || 'all'],
    queryFn: () => dashboardService.getMetrics(branchId || undefined),
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 * 5, // auto refresh cada 5 minutos
  });
};
