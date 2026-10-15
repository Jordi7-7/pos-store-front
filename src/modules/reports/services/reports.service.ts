import { apiClient } from '@/lib/apiClient';
import type { SalesCostReportRow, ValuedInventoryRow, ProductSaleRow } from '../types/reports.types';

export const reportsService = {
  getSalesCost: async (startDate: string, endDate: string, branchId?: string): Promise<SalesCostReportRow[]> => {
    const query = new URLSearchParams({ startDate, endDate });
    if (branchId) query.append('branchId', branchId);
    return apiClient.get<SalesCostReportRow[]>(`/reports/sales-cost?${query.toString()}`);
  },
  getProductSales: async (startDate: string, endDate: string, branchId?: string): Promise<ProductSaleRow[]> => {
    const query = new URLSearchParams({ startDate, endDate });
    if (branchId) query.append('branchId', branchId);
    return apiClient.get<ProductSaleRow[]>(`/reports/product-sales?${query.toString()}`);
  },
  getValuedInventory: async (params?: { page?: number; limit?: number; branchId?: string }): Promise<{ data: ValuedInventoryRow[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.branchId) query.append('branchId', params.branchId);
    const queryString = query.toString();
    return apiClient.get(`/reports/valued-inventory${queryString ? `?${queryString}` : ''}`);
  }
};
