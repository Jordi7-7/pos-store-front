import { apiClient } from '@/lib/apiClient';
import type { ReportsRepository } from '../../application/ports/reports.repository';
import type { ProductSaleRow, SalesCostReportRow, ValuedInventoryPage } from '../../domain/entities/report.entity';

const range = (startDate: string, endDate: string, branchId?: string): string => {
  const query = new URLSearchParams({ startDate, endDate });
  if (branchId) query.append('branchId', branchId);
  return query.toString();
};

/** Informes por HTTP. La API ya responde con la forma de la entidad. */
export class ReportsHttpRepository implements ReportsRepository {
  salesCost(startDate: string, endDate: string, branchId?: string): Promise<SalesCostReportRow[]> {
    return apiClient.get<SalesCostReportRow[]>(`/reports/sales-cost?${range(startDate, endDate, branchId)}`);
  }

  productSales(startDate: string, endDate: string, branchId?: string): Promise<ProductSaleRow[]> {
    return apiClient.get<ProductSaleRow[]>(`/reports/product-sales?${range(startDate, endDate, branchId)}`);
  }

  valuedInventory(params?: { page?: number; limit?: number; branchId?: string }): Promise<ValuedInventoryPage> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.branchId) query.append('branchId', params.branchId);
    const queryString = query.toString();
    return apiClient.get<ValuedInventoryPage>(`/reports/valued-inventory${queryString ? `?${queryString}` : ''}`);
  }
}
