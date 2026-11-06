import type { ProductSaleRow, SalesCostReportRow, ValuedInventoryPage } from '../../domain/entities/report.entity';

/** Puerto de salida: informes de gestión en el servidor. */
export interface ReportsRepository {
  salesCost(startDate: string, endDate: string, branchId?: string): Promise<SalesCostReportRow[]>;
  productSales(startDate: string, endDate: string, branchId?: string): Promise<ProductSaleRow[]>;
  valuedInventory(params?: { page?: number; limit?: number; branchId?: string }): Promise<ValuedInventoryPage>;
}
