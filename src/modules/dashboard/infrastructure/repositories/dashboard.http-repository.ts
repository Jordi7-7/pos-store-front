import { apiClient } from '@/lib/apiClient';
import type { DashboardRepository } from '../../application/ports/dashboard.repository';
import type { DashboardMetrics } from '../../domain/entities/dashboard-metrics.entity';

/** Métricas del panel por HTTP. La API ya responde con la forma de la entidad. */
export class DashboardHttpRepository implements DashboardRepository {
  metrics(branchId?: string): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>(branchId ? `/dashboard/metrics?branchId=${branchId}` : '/dashboard/metrics');
  }
}
