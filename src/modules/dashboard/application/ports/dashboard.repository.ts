import type { DashboardMetrics } from '../../domain/entities/dashboard-metrics.entity';

/** Puerto de salida: métricas del panel en el servidor. */
export interface DashboardRepository {
  metrics(branchId?: string): Promise<DashboardMetrics>;
}
