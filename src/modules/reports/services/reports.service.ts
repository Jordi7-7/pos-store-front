import { apiClient } from '@/lib/apiClient';
import type { ReportsResponse, SalesCostReportRow, ValuedInventoryRow } from '../types/reports.types';

export const reportsService = {
  getSummary: async (startDate: string, endDate: string): Promise<ReportsResponse> => {
    return apiClient.get<ReportsResponse>(`/reports/summary?startDate=${startDate}&endDate=${endDate}`);
  },
  getSalesCost: async (startDate: string, endDate: string): Promise<SalesCostReportRow[]> => {
    return apiClient.get<SalesCostReportRow[]>(`/reports/sales-cost?startDate=${startDate}&endDate=${endDate}`);
  },
  getValuedInventory: async (params?: { page?: number; limit?: number }): Promise<{ data: ValuedInventoryRow[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();
    return apiClient.get(`/reports/valued-inventory${queryString ? `?${queryString}` : ''}`);
  }
};
