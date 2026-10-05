import { apiClient } from '@/lib/apiClient';
import type { DashboardMetrics } from '../types';

export const dashboardService = {
  getMetrics: async (branchId?: string): Promise<DashboardMetrics> => {
    const url = branchId ? `/dashboard/metrics?branchId=${branchId}` : '/dashboard/metrics';
    return apiClient.get<DashboardMetrics>(url);
  },
};
