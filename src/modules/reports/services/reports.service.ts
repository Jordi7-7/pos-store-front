import { apiClient } from '@/lib/apiClient';
import type { ReportsResponse, SalesCostReportRow } from '../types/reports.types';

export const reportsService = {
  getSummary: async (startDate: string, endDate: string): Promise<ReportsResponse> => {
    return apiClient.get<ReportsResponse>(`/reports/summary?startDate=${startDate}&endDate=${endDate}`);
  },
  getSalesCost: async (startDate: string, endDate: string): Promise<SalesCostReportRow[]> => {
    return apiClient.get<SalesCostReportRow[]>(`/reports/sales-cost?startDate=${startDate}&endDate=${endDate}`);
  }
};
