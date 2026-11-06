import { apiClient } from '@/lib/apiClient';
import type {
  ProcessRefundInput,
  ProcessSaleInput,
  SaleReceipt,
  SalesPage,
  SalesQuery,
  SalesRepository,
} from '../../application/ports/sales.repository';
import type { SaleDetailEntity } from '../../domain/entities/sale.entity';
import type { PaginatedSalesDTO, SaleDetailDTO } from '../dtos/sales.dto';
import { toSaleDetailEntity, toSaleSummaryEntities } from '../mappers/sale.mapper';

/** Ventas por HTTP: convierte las respuestas (DTO) en entidades del dominio. */
export class SalesHttpRepository implements SalesRepository {
  async processSale(input: ProcessSaleInput): Promise<SaleReceipt> {
    return apiClient.post<SaleReceipt>('/sales', input);
  }

  async list(query: SalesQuery): Promise<SalesPage> {
    const params = new URLSearchParams();
    if (query.startDate) params.set('startDate', query.startDate);
    if (query.endDate) params.set('endDate', query.endDate);
    if (query.branchId) params.set('branchId', query.branchId);
    params.set('page', String(query.page || 1));
    params.set('limit', String(query.limit || 10));
    const response = await apiClient.get<PaginatedSalesDTO>(`/sales/paginated?${params.toString()}`);
    return { items: toSaleSummaryEntities(response.data), meta: response.meta };
  }

  async getByInvoice(invoiceNumber: string): Promise<SaleDetailEntity> {
    return toSaleDetailEntity(await apiClient.get<SaleDetailDTO>(`/sales/invoice/${encodeURIComponent(invoiceNumber)}`));
  }

  async processRefund(input: ProcessRefundInput): Promise<void> {
    await apiClient.post('/sales/refunds', input);
  }
}
